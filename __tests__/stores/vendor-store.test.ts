import { useVendorStore } from "@/stores/vendor-store";

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn().mockReturnThis(),
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
  transformVendorFromDb: jest.fn((v: any) => ({
    id: v.id || "test-vendor-id",
    name: v.name || "Test Vendor",
    category: v.category || "Venue",
    description: v.description || "A test vendor",
    rating: v.rating ?? 4.5,
    reviewCount: v.review_count ?? 10,
    priceRange: v.price_range || "₹50,000 - ₹2,00,000",
    minPrice: v.min_price ?? 50000,
    maxPrice: v.max_price ?? 200000,
    location: v.location || { city: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
    coverImage: v.cover_image || "https://example.com/image.jpg",
    gallery: v.gallery || [],
    features: v.features || [],
    services: v.services || [],
    packages: v.packages || [],
    availability: v.availability || {},
    featured: v.featured ?? false,
    isAvailable: v.is_available ?? true,
    verified: v.verified ?? false,
    completedBookings: v.completed_bookings ?? 0,
    contact: v.contact || {},
    createdAt: v.created_at || new Date().toISOString(),
    updatedAt: v.updated_at || new Date().toISOString(),
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

describe("Vendor Store", () => {
  beforeEach(() => {
    useVendorStore.setState({
      vendors: [],
      favoriteVendors: [],
      loading: false,
      error: null,
      currentVendorPage: 0,
      hasMoreVendors: true,
      vendorSearchQuery: "",
      vendorFilters: {},
    });
  });

  it("has correct initial shape", () => {
    const state = useVendorStore.getState();
    expect(state).toHaveProperty("vendors");
    expect(state).toHaveProperty("favoriteVendors");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("loadVendors");
    expect(state).toHaveProperty("loadMoreVendors");
    expect(state).toHaveProperty("searchVendors");
    expect(state).toHaveProperty("toggleFavoriteVendor");
    expect(state).toHaveProperty("loadFavoriteVendors");
  });

  it("starts with empty vendors", () => {
    expect(useVendorStore.getState().vendors).toEqual([]);
  });

  it("starts with loading false", () => {
    expect(useVendorStore.getState().loading).toBe(false);
  });

  it("starts with error null", () => {
    expect(useVendorStore.getState().error).toBeNull();
  });

  it("clears error", () => {
    useVendorStore.setState({ error: "Some error" });
    useVendorStore.getState().clearError();
    expect(useVendorStore.getState().error).toBeNull();
  });

  it("sets filters", () => {
    const filters = { category: "Venue", rating: 4 };
    useVendorStore.getState().setFilters(filters);
    expect(useVendorStore.getState().vendorFilters).toEqual(filters);
  });

  it("clears filters", () => {
    useVendorStore.setState({ vendorFilters: { category: "Venue" }, vendorSearchQuery: "test" });
    useVendorStore.getState().clearFilters();
    expect(useVendorStore.getState().vendorFilters).toEqual({});
    expect(useVendorStore.getState().vendorSearchQuery).toBe("");
  });

  it("filters vendors by query", () => {
    const vendors = [
      { id: "1", name: "Grand Venue", description: "A big venue", rating: 4.5, category: "Venue", priceRange: "₹50k", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 10 } as any,
      { id: "2", name: "Chef Catering", description: "Best food", rating: 4.8, category: "Catering", priceRange: "₹30k", minPrice: 30000, maxPrice: 100000, location: "Mumbai", isAvailable: true, verified: false, completedBookings: 5 } as any,
    ];
    const result = useVendorStore.getState().filterVendors(vendors, { query: "venue" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Grand Venue");
  });

  it("filters vendors by category", () => {
    const vendors = [
      { id: "1", name: "Grand Venue", description: "A big venue", rating: 4.5, category: "Venue", priceRange: "₹50k", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 10 } as any,
      { id: "2", name: "Chef Catering", description: "Best food", rating: 4.8, category: "Catering", priceRange: "₹30k", minPrice: 30000, maxPrice: 100000, location: "Mumbai", isAvailable: true, verified: false, completedBookings: 5 } as any,
    ];
    const result = useVendorStore.getState().filterVendors(vendors, { category: "Catering" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Chef Catering");
  });

  it("filters vendors by rating", () => {
    const vendors = [
      { id: "1", name: "Grand Venue", description: "A big venue", rating: 4.5, category: "Venue", priceRange: "₹50k", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 10 } as any,
      { id: "2", name: "Best Vendor", description: "Top rated", rating: 4.9, category: "Catering", priceRange: "₹30k", minPrice: 30000, maxPrice: 100000, location: "Mumbai", isAvailable: true, verified: false, completedBookings: 5 } as any,
    ];
    const result = useVendorStore.getState().filterVendors(vendors, { rating: 4.8 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Best Vendor");
  });

  it("filters vendors by verified", () => {
    const vendors = [
      { id: "1", name: "Grand Venue", description: "A big venue", rating: 4.5, category: "Venue", priceRange: "₹50k", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 10 } as any,
      { id: "2", name: "Chef Catering", description: "Best food", rating: 4.8, category: "Catering", priceRange: "₹30k", minPrice: 30000, maxPrice: 100000, location: "Mumbai", isAvailable: true, verified: false, completedBookings: 5 } as any,
    ];
    const result = useVendorStore.getState().filterVendors(vendors, { verified: true });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Grand Venue");
  });

  it("sorts vendors by rating descending", () => {
    const vendors = [
      { id: "1", name: "Grand Venue", rating: 4.5, category: "Venue", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 10 } as any,
      { id: "2", name: "Best Vendor", rating: 4.9, category: "Venue", minPrice: 30000, maxPrice: 100000, location: "Mumbai", isAvailable: true, verified: false, completedBookings: 5 } as any,
    ];
    const result = useVendorStore.getState().sortVendors(vendors, "rating", "desc");
    expect(result[0].name).toBe("Best Vendor");
    expect(result[1].name).toBe("Grand Venue");
  });

  it("gets vendor by id", () => {
    const vendor = { id: "test-1", name: "Test", rating: 4.5, category: "Venue", minPrice: 50000, maxPrice: 200000, location: "Mumbai", isAvailable: true, verified: true, completedBookings: 0, description: "desc", priceRange: "₹50k", coverImage: "", gallery: [], features: [], services: [], packages: [], availability: {}, contact: {}, createdAt: "", updatedAt: "" } as any;
    useVendorStore.setState({ vendors: [vendor] });
    const result = useVendorStore.getState().getVendorById("test-1");
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test");
  });

  it("returns null for non-existent vendor", () => {
    const result = useVendorStore.getState().getVendorById("non-existent");
    expect(result).toBeNull();
  });

  it("calculates distance between two locations", () => {
    const loc1 = { latitude: 19.076, longitude: 72.8777 };
    const loc2 = { latitude: 19.113, longitude: 72.8697 };
    const distance = useVendorStore.getState().calculateDistance(loc1, loc2);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(10); // ~4km in Mumbai
  });

  it("returns 0 distance for string locations", () => {
    const distance = useVendorStore.getState().calculateDistance("Mumbai" as any, "Pune" as any);
    expect(distance).toBe(0);
  });
});
