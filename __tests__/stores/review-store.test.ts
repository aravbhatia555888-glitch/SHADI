import { useReviewStore } from "@/stores/review-store";

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
  transformReviewFromDb: jest.fn((r: any) => ({
    id: r.id || "test-review-id",
    vendorId: r.vendor_id || "test-vendor-id",
    userId: r.user_id || "test-user-id",
    userName: r.user_name || "Test User",
    rating: r.rating ?? 5,
    comment: r.comment || "Great vendor!",
    photos: r.photos || [],
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  })),
}));

jest.mock("@/utils/api-validator", () => ({
  validate: jest.fn((_schema: any, data: any) => ({
    success: true,
    data,
    error: undefined,
  })),
}));

jest.mock("@/utils/retry", () => ({
  withRetry: jest.fn((fn: () => Promise<any>) => fn()),
}));

describe("Review Store", () => {
  beforeEach(() => {
    useReviewStore.setState({
      reviews: [],
      loading: false,
      error: null,
    });
  });

  it("has correct initial shape", () => {
    const state = useReviewStore.getState();
    expect(state).toHaveProperty("reviews");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("loadVendorReviews");
    expect(state).toHaveProperty("addVendorReview");
    expect(state).toHaveProperty("updateVendorReview");
    expect(state).toHaveProperty("deleteVendorReview");
    expect(state).toHaveProperty("clearReviews");
    expect(state).toHaveProperty("clearError");
  });

  it("starts with empty reviews", () => {
    expect(useReviewStore.getState().reviews).toEqual([]);
  });

  it("starts with loading false", () => {
    expect(useReviewStore.getState().loading).toBe(false);
  });

  it("clears reviews", () => {
    useReviewStore.setState({
      reviews: [
        {
          id: "1",
          vendorId: "v1",
          userId: "u1",
          userName: "User",
          rating: 5,
          comment: "Great!",
          photos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    useReviewStore.getState().clearReviews();
    expect(useReviewStore.getState().reviews).toEqual([]);
    expect(useReviewStore.getState().error).toBeNull();
  });

  it("clears error", () => {
    useReviewStore.setState({ error: "Some error" });
    useReviewStore.getState().clearError();
    expect(useReviewStore.getState().error).toBeNull();
  });

  it("adds a review optimistically to local state", async () => {
    const result = await useReviewStore.getState().addVendorReview({
      vendorId: "vendor-1",
      userId: "user-1",
      userName: "Test User",
      rating: 5,
      comment: "Amazing vendor!",
    });

    expect(result.success).toBe(true);
    const reviews = useReviewStore.getState().reviews;
    expect(reviews.length).toBe(1);
    expect(reviews[0].userName).toBe("Test User");
    expect(reviews[0].rating).toBe(5);
    expect(reviews[0].comment).toBe("Amazing vendor!");
  });

  it("deletes a review from local state", async () => {
    useReviewStore.setState({
      reviews: [
        {
          id: "review-1",
          vendorId: "v1",
          userId: "u1",
          userName: "User",
          rating: 4,
          comment: "Good",
          photos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    const result = await useReviewStore.getState().deleteVendorReview("review-1");
    expect(result.success).toBe(true);
    expect(useReviewStore.getState().reviews).toHaveLength(0);
  });
});
