import { useInquiryStore } from "@/stores/inquiry-store";
import { supabase } from "@/config/supabase";

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
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
  transformInquiryFromDb: jest.fn((i: any) => ({
    id: i.id || "test-inquiry-id",
    vendorId: i.vendor_id || "test-vendor-id",
    userId: i.user_id || "test-user-id",
    userName: i.user_name || "Test User",
    userEmail: i.user_email || "test@example.com",
    userPhone: i.user_phone || "+91 9876543210",
    subject: i.subject || "Quote Request",
    message: i.message || "I'd like a quote",
    status: i.status || "new",
    eventDate: i.event_date || undefined,
    eventType: i.event_type || undefined,
    budget: i.budget || undefined,
    vendorResponse: i.vendor_response || undefined,
    responseDate: i.response_date || undefined,
    createdAt: i.created_at || new Date().toISOString(),
    updatedAt: i.updated_at || new Date().toISOString(),
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

describe("Inquiry Store", () => {
  beforeEach(() => {
    useInquiryStore.setState({
      inquiries: [],
      loading: false,
      error: null,
    });
  });

  it("has correct initial shape", () => {
    const state = useInquiryStore.getState();
    expect(state).toHaveProperty("inquiries");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("loadUserInquiries");
    expect(state).toHaveProperty("sendInquiry");
    expect(state).toHaveProperty("updateInquiryStatus");
    expect(state).toHaveProperty("replyToInquiry");
    expect(state).toHaveProperty("deleteInquiry");
    expect(state).toHaveProperty("clearError");
  });

  it("starts with empty inquiries", () => {
    expect(useInquiryStore.getState().inquiries).toEqual([]);
  });

  it("starts with loading false", () => {
    expect(useInquiryStore.getState().loading).toBe(false);
  });

  it("starts with error null", () => {
    expect(useInquiryStore.getState().error).toBeNull();
  });

  it("clears error", () => {
    useInquiryStore.setState({ error: "Some error" });
    useInquiryStore.getState().clearError();
    expect(useInquiryStore.getState().error).toBeNull();
  });

  it("sendInquiry without authentication returns error", async () => {
    // Use the imported supabase mock directly instead of require() pattern
    const getUserMock = supabase.auth.getUser as jest.Mock;
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await useInquiryStore.getState().sendInquiry({
      vendorId: "vendor-1",
      userName: "Test",
      userEmail: "test@test.com",
      userPhone: "+911234567890",
      subject: "Quote",
      message: "Hello",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not authenticated");
  });
});
