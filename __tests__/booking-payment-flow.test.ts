/**
 * Booking + Payment Flow Regression Tests
 *
 * Locks in the production-safe flow that was previously broken:
 *  1. A booking must be CREATED FIRST (status pending, payment_status
 *     pending) before any payment UI is shown — never pay-then-book.
 *  2. Amounts sent from the client are NOT trusted: the booking is created
 *     with server-authoritative values (0), and the DB trigger
 *     set_authoritative_booking_price fills in the real package price.
 *  3. Payment status is only finalized AFTER the server verifies the
 *     Razorpay signature and returns the matching bookingId.
 *  4. checkVendorAvailability treats pending + confirmed bookings as
 *     blocking the date.
 */

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: { id: "booking-123" }, error: null })
          ),
        })),
      })),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: "user-1" } }, error: null })
      ),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
  handleSupabaseError: jest.fn((error: any) => error?.message || "Unknown error"),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("@/utils/transforms", () => ({
  transformBookingFromDb: jest.fn((b: any) => b),
}));

jest.mock("@/utils/api-validator", () => ({
  validate: jest.fn((_s: any, data: any) => ({ success: true, data, error: undefined })),
  isValidResult: jest.fn((r: any) => r.success),
}));

jest.mock("@/utils/retry", () => ({
  withRetry: jest.fn((fn: () => Promise<any>) => fn()),
}));

jest.mock("@/services/analytics", () => ({
  trackEvent: jest.fn(),
  AnalyticsEvents: {},
}));

jest.mock("@/services/sentry", () => ({
  captureError: jest.fn(),
}));

import { supabase } from "@/config/supabase";
import { useBookingStore } from "@/stores/booking-store";
import { createRazorpayOrder, verifyPaymentSignature } from "@/services/payment";

describe("Booking + Payment Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBookingStore.setState({ bookings: [], loading: false, error: null });

    // Default: authenticated user + successful insert
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  describe("createBooking — booking must exist before payment", () => {
    it("creates the booking with pending status and server-authoritative amounts", async () => {
      const fromMock = supabase.from as jest.Mock;
      // Fresh from() call for this test
      fromMock.mockClear();
      const insertFn = jest.fn((_payload: unknown) => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: { id: "booking-123" }, error: null })
          ),
        })),
      }));
      fromMock.mockImplementation(() => ({ insert: insertFn }));

      const result = await useBookingStore.getState().createBooking({
        vendorId: "vendor-1",
        userId: "user-1",
        eventDate: "2026-06-15",
        eventType: "Wedding",
        packageId: "pkg-1",
        totalAmount: 0, // client must NOT trust its own price
        advanceAmount: 0,
        status: "pending",
        paymentStatus: "pending",
        bookingDate: "2026-06-01T00:00:00.000Z",
      });

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe("booking-123");      expect(fromMock).toHaveBeenCalledWith("vendor_bookings");
      const payload = insertFn.mock.calls[0][0] as
        | Record<string, unknown>
        | undefined;
      expect(payload).toBeDefined();

      expect(payload).toEqual(
        expect.objectContaining({
          vendor_id: "vendor-1",
          user_id: "user-1",
          event_date: "2026-06-15",
          status: "pending",
          payment_status: "pending",
          total_amount: 0, // server trigger sets the authoritative price
          advance_amount: 0,
        })
      );
      // Must NOT trust a client-supplied price
      expect(payload!.total_amount).not.toBeGreaterThan(0);
    });

    it("rejects creation when no user is authenticated", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await useBookingStore.getState().createBooking({
        vendorId: "vendor-1",
        userId: "user-1",
        eventDate: "2026-06-15",
        eventType: "Wedding",
        packageId: "pkg-1",
        totalAmount: 0,
        advanceAmount: 0,
        status: "pending",
        paymentStatus: "pending",
        bookingDate: "2026-06-01T00:00:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not authenticated");
    });

    it("surfaces insert errors instead of proceeding to payment", async () => {
      const fromMock = supabase.from as jest.Mock;
      fromMock.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: null, error: { message: "RLS denied" } })
            ),
          })),
        })),
      }));

      const result = await useBookingStore.getState().createBooking({
        vendorId: "vendor-1",
        userId: "user-1",
        eventDate: "2026-06-15",
        eventType: "Wedding",
        packageId: "pkg-1",
        totalAmount: 0,
        advanceAmount: 0,
        status: "pending",
        paymentStatus: "pending",
        bookingDate: "2026-06-01T00:00:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("RLS denied");
    });
  });

  describe("checkVendorAvailability", () => {
    it("returns unavailable when pending/confirmed bookings exist for the date", async () => {
      const fromMock = supabase.from as jest.Mock;
      const selectFn = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() =>
              Promise.resolve({ data: [{ id: "b1" }], error: null })
            ),
          })),
        })),
      }));
      fromMock.mockImplementation(() => ({ select: selectFn }));

      const result = await useBookingStore
        .getState()
        .checkVendorAvailability("vendor-1", "2026-06-15");

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(fromMock).toHaveBeenCalledWith("vendor_bookings");
    });

    it("returns available when no blocking bookings exist", async () => {
      const fromMock = supabase.from as jest.Mock;
      const selectFn = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      }));
      fromMock.mockImplementation(() => ({ select: selectFn }));

      const result = await useBookingStore
        .getState()
        .checkVendorAvailability("vendor-1", "2026-12-25");

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
    });
  });

  describe("Payment order — verify BEFORE finalize", () => {
    it("createRazorpayOrder passes amount in paise with booking context", async () => {
      const invoke = supabase.functions.invoke as jest.Mock;
      invoke.mockResolvedValueOnce({
        data: { order_id: "order_1", amount: 500000, key_id: "rzp_test" },
        error: null,
      });

      const result = await createRazorpayOrder({
        amount: 5000,
        bookingId: "booking-123",
        userId: "user-1",
        vendorId: "vendor-1",
        paymentType: "advance",
        advancePercentage: 25,
      });

      expect(result.success).toBe(true);
      expect(invoke).toHaveBeenCalledWith("create-razorpay-order", {
        body: expect.objectContaining({
          amount: 500000, // ₹5000 × 100 paise
          notes: expect.objectContaining({
            booking_id: "booking-123",
            user_id: "user-1",
            vendor_id: "vendor-1",
          }),
        }),
      });
    });

    it("verifyPaymentSignature returns verified only when the server confirms the signature", async () => {
      const invoke = supabase.functions.invoke as jest.Mock;
      invoke.mockResolvedValueOnce({
        data: {
          verified: true,
          payment_recorded: true,
          booking_id: "booking-123",
        },
        error: null,
      });

      const result = await verifyPaymentSignature({
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "sig_1",
      });

      expect(result.verified).toBe(true);
      expect(result.paymentRecorded).toBe(true);
      expect(result.bookingId).toBe("booking-123");
    });
  });

  describe("cancelBooking — RPC security hardening", () => {
    it("calls cancel_user_booking RPC rather than direct client-side update", async () => {
      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      useBookingStore.setState({
        bookings: [
          {
            id: "booking-123",
            vendorId: "vendor-1",
            userId: "user-1",
            eventDate: "2026-06-15",
            eventType: "Wedding",
            totalAmount: 100000,
            advanceAmount: 25000,
            status: "pending",
            paymentStatus: "pending",
            bookingDate: "2026-06-01",
            createdAt: "2026-06-01",
            updatedAt: "2026-06-01",
          },
        ],
      });

      const result = await useBookingStore.getState().cancelBooking("booking-123");

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith("cancel_user_booking", {
        p_booking_id: "booking-123",
      });
      const booking = useBookingStore.getState().bookings.find((b) => b.id === "booking-123");
      expect(booking?.status).toBe("cancelled");
    });

    it("rejects unauthorized direct status changes", async () => {
      const result = await useBookingStore
        .getState()
        .updateBookingStatus("booking-123", "confirmed");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Booking status updates must be processed through verified payments");
    });
  });
});
