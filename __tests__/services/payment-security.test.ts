/**
 * Payment Security Tests
 *
 * Verifies that client-side payment functions enforce the security contract:
 * - createRazorpayOrder sends correct params (amount in paise, booking_id in notes)
 * - verifyPaymentSignature calls the Edge Function (no direct DB writes)
 * - savePaymentTransaction and updateBookingPaymentStatus are no-ops (server-side only)
 * - buildRazorpayCheckoutHtml uses JSON.stringify (no XSS via string interpolation)
 */

// Mock supabase client
const mockInvoke = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
  handleSupabaseError: jest.fn(() => "Error"),
}));

jest.mock("@/services/analytics", () => ({
  trackEvent: jest.fn(),
  AnalyticsEvents: {},
}));

import {
  createRazorpayOrder,
  verifyPaymentSignature,
  savePaymentTransaction,
  updateBookingPaymentStatus,
  buildRazorpayCheckoutHtml,
  buildCheckoutPageUrl,
  NATIVE_REDIRECT_URI,
} from "@/services/payment";
import fs from "fs";
import path from "path";

describe("Payment Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createRazorpayOrder", () => {
    it("sends amount in paise (INR × 100) to Edge Function", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { order_id: "order_123", amount: 5000000, key_id: "rzp_test" },
        error: null,
      });

      await createRazorpayOrder({
        amount: 50000,
        bookingId: "b1",
        userId: "u1",
        vendorId: "v1",
        paymentType: "full",
      });

      const callBody = mockInvoke.mock.calls[0][1].body;
      expect(callBody.amount).toBe(5000000); // 50000 × 100
    });

    it("includes booking_id, user_id, vendor_id in notes", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { order_id: "order_123", amount: 10000, key_id: "rzp_test" },
        error: null,
      });

      await createRazorpayOrder({
        amount: 100,
        bookingId: "booking-abc",
        userId: "user-xyz",
        vendorId: "vendor-001",
        paymentType: "advance",
        advancePercentage: 30,
      });

      const callBody = mockInvoke.mock.calls[0][1].body;
      expect(callBody.notes).toEqual(
        expect.objectContaining({
          booking_id: "booking-abc",
          user_id: "user-xyz",
          vendor_id: "vendor-001",
          payment_type: "advance",
          advance_percentage: "30",
        })
      );
    });

    it("returns success with orderId, amount, keyId", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { order_id: "order_xyz", amount: 500000, key_id: "rzp_live_xxx" },
        error: null,
      });

      const result = await createRazorpayOrder({
        amount: 5000,
        bookingId: "b1",
        userId: "u1",
        vendorId: "v1",
        paymentType: "full",
      });

      expect(result).toEqual({
        success: true,
        orderId: "order_xyz",
        amount: 500000,
        keyId: "rzp_live_xxx",
      });
    });

    it("returns error on Edge Function failure", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Payment service unavailable" },
      });

      const result = await createRazorpayOrder({
        amount: 1000,
        bookingId: "b1",
        userId: "u1",
        vendorId: "v1",
        paymentType: "full",
      });

      expect(result).toEqual({
        success: false,
        error: "Payment service unavailable",
      });
    });
  });

  describe("Edge Function order safety", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/functions/create-razorpay-order/index.ts"
      ),
      "utf8"
    );

    it("uses a compact server-generated receipt instead of trusting client input", () => {
      expect(source).toContain("const receipt = `sb_");
      expect(source).not.toContain("const { currency, receipt, notes }");
    });

    it("fails order creation when server-side transaction tracking fails", () => {
      expect(source).toContain("if (trackingError)");
      expect(source).toContain("Failed to initialize payment tracking");
    });
  });

  describe("verifyPaymentSignature", () => {
    it("calls Edge Function with the Razorpay triple", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { verified: true },
        error: null,
      });

      await verifyPaymentSignature({
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "sig_1",
      });

      expect(mockInvoke).toHaveBeenCalledWith("verify-razorpay-payment", {
        body: {
          razorpay_order_id: "order_1",
          razorpay_payment_id: "pay_1",
          razorpay_signature: "sig_1",
        },
      });
    });

    it("returns verified: true on success", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          verified: true,
          payment_recorded: true,
          booking_id: "booking-1",
        },
        error: null,
      });

      const result = await verifyPaymentSignature({
        razorpay_order_id: "o",
        razorpay_payment_id: "p",
        razorpay_signature: "s",
      });

      expect(result).toEqual({
        verified: true,
        paymentRecorded: true,
        subscriptionActivated: false,
        bookingId: "booking-1",
        vendorId: undefined,
      });
    });

    it("returns verified: false with user-friendly error on failure", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { verified: false },
        error: null,
      });

      const result = await verifyPaymentSignature({
        razorpay_order_id: "o",
        razorpay_payment_id: "p",
        razorpay_signature: "bad",
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain("refund");
    });
  });

  it("preserves subscription context returned by the verifier", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        verified: true,
        subscription_activated: true,
        vendor_id: "vendor-1",
      },
      error: null,
    });

    const result = await verifyPaymentSignature({
      razorpay_order_id: "o",
      razorpay_payment_id: "p",
      razorpay_signature: "s",
    });

    expect(result.subscriptionActivated).toBe(true);
    expect(result.vendorId).toBe("vendor-1");
    expect(result.paymentRecorded).toBe(false);
  });

  describe("savePaymentTransaction", () => {
    it("is a no-op — does NOT write to payment_transactions", async () => {
      const result = await savePaymentTransaction({
        bookingId: "b1",
        userId: "u1",
        vendorId: "v1",
        amount: 50000,
        razorpayOrderId: "order_1",
        razorpayPaymentId: "pay_1",
        razorpaySignature: "sig_1",
        paymentType: "full",
      });

      // Should not have called supabase.from() for an insert
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("updateBookingPaymentStatus", () => {
    it("is a no-op — does NOT update vendor_bookings", async () => {
      const result = await updateBookingPaymentStatus({
        bookingId: "b1",
        status: "paid",
      });

      expect(mockFrom).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("buildRazorpayCheckoutHtml", () => {
    it("uses JSON.stringify for options — no raw string interpolation of user data", () => {
      const html = buildRazorpayCheckoutHtml({
        key: "rzp_test_123",
        amount: 500000,
        currency: "INR",
        order_id: "order_1",
        name: 'Venue with "quotes" and <script>alert(1)</script>',
        description: "Test",
        prefill: {
          name: "User Name",
          email: "user@test.com",
          contact: "9876543210",
        },
      });

      // The malicious script tag should NOT appear as raw HTML
      expect(html).not.toContain("<script>alert(1)</script>");

      // The options should be serialized as JSON (escaped)
      expect(html).toContain("var rawOptions = ");
      expect(html).toContain("\\u003Cscript\\u003E");
    });

    it("redirects to the app's REGISTERED scheme by default (C3 fix)", () => {
      const html = buildRazorpayCheckoutHtml({
        key: "rzp_test",
        amount: 100,
        currency: "INR",
        order_id: "order_x",
        name: "Test",
        description: "Test",
        prefill: { name: "", email: "", contact: "" },
      });

      expect(html).toContain("rawOptions.handler");
      expect(html).toContain("rawOptions.modal");
      // C3: razorpay:// belonged to no registered app — results could
      // never reach the client. Default is now the app scheme.
      expect(html).not.toContain("razorpay://payment");
      expect(html).toContain('var REDIRECT = "shaadibazaar://payment-result"');
      expect(html).toContain('REDIRECT + "?" + params');
      expect(html).toContain('back("event=cancel")');
    });

    it("honors an explicit redirectUri (query-string separator included)", () => {
      const html = buildRazorpayCheckoutHtml({
        key: "rzp_test",
        amount: 100,
        currency: "INR",
        order_id: "order_x",
        name: "Test",
        description: "Test",
        prefill: { name: "", email: "", contact: "" },
        redirectUri: "https://shaadibazaar.com/payment-result?a=b",
      });

      expect(html).toContain(
        'var REDIRECT = "https://shaadibazaar.com/payment-result?a=b"'
      );
      expect(html).toContain('REDIRECT + "&" + params');
      expect(html).not.toContain("razorpay://");
    });
  });

  describe("buildCheckoutPageUrl (C3 fix)", () => {
    it("points at the razorpay-checkout Edge Function with the native scheme redirect", () => {
      // baseUrl passed explicitly: expo's babel transform inlines
      // EXPO_PUBLIC_* reads, so runtime env injection isn't observable here.
      const url = buildCheckoutPageUrl(
        {
          keyId: "rzp_test_123",
          orderId: "order_9",
          amountPaise: 123456,
          name: "ShaadiBazaar",
          description: "Payment for Venue",
          prefillName: "A",
          prefillEmail: "a@b.c",
          prefillContact: "999",
        },
        "https://sb.example.supabase.co/"
      );

      expect(url).toBe(
        "https://sb.example.supabase.co/functions/v1/razorpay-checkout" +
          "?order_id=order_9&key_id=rzp_test_123&amount=123456" +
          "&name=ShaadiBazaar&description=Payment+for+Venue" +
          `&redirect=${encodeURIComponent(NATIVE_REDIRECT_URI)}` +
          "&prefill_name=A&prefill_email=a%40b.c&prefill_contact=999"
      );
    });
  });
});
