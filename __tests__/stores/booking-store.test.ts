import { useBookingStore } from "@/stores/booking-store";

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: "test-user" } }, error: null })
      ),
    },
    rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
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
  transformBookingFromDb: jest.fn((b: any) => ({
    id: b.id || "test-booking-id",
    vendorId: b.vendor_id || "test-vendor-id",
    userId: b.user_id || "test-user-id",
    eventDate: b.event_date || "2026-06-15",
    eventType: b.event_type || "Wedding",
    packageId: b.package_id || undefined,
    customRequirements: b.custom_requirements || "",
    totalAmount: b.total_amount ?? 50000,
    advanceAmount: b.advance_amount ?? 10000,
    status: b.status || "pending",
    paymentStatus: b.payment_status || "pending",
    bookingDate: b.booking_date || new Date().toISOString(),
    notes: b.notes || "",
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  })),
}));

jest.mock("@/utils/api-validator", () => ({
  validate: jest.fn((_schema: any, data: any) => ({
    success: true,
    data,
    error: undefined,
  })),
  validateOrThrow: jest.fn((_schema: any, data: any) => data),
}));

jest.mock("@/utils/retry", () => ({
  withRetry: jest.fn((fn: () => Promise<any>) => fn()),
}));

describe("Booking Store", () => {
  beforeEach(() => {
    useBookingStore.setState({
      bookings: [],
      loading: false,
      error: null,
    });
  });

  it("has correct initial shape", () => {
    const state = useBookingStore.getState();
    expect(state).toHaveProperty("bookings");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("loadUserBookings");
    expect(state).toHaveProperty("createBooking");
    expect(state).toHaveProperty("checkVendorAvailability");
    expect(state).toHaveProperty("updateBookingStatus");
    expect(state).toHaveProperty("cancelBooking");
    expect(state).toHaveProperty("clearError");
  });

  it("starts with empty bookings", () => {
    expect(useBookingStore.getState().bookings).toEqual([]);
  });

  it("starts with loading false", () => {
    expect(useBookingStore.getState().loading).toBe(false);
  });

  it("starts with error null", () => {
    expect(useBookingStore.getState().error).toBeNull();
  });

  it("clears error", () => {
    useBookingStore.setState({ error: "Some error" });
    useBookingStore.getState().clearError();
    expect(useBookingStore.getState().error).toBeNull();
  });

  it("cancelBooking calls cancel_user_booking RPC", async () => {
    const result = await useBookingStore.getState().cancelBooking("test-booking-id");
    expect(result).toEqual({ success: true });
  });
});
