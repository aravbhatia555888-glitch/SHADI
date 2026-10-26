import {
  transformVendorFromDb,
  transformReviewFromDb,
  transformBookingFromDb,
  transformInquiryFromDb,
  transformProfileToUser,
  transformChecklistFromDb,
  transformBudgetFromDb,
} from "@/utils/transforms";

describe("transformVendorFromDb", () => {
  it("transforms all fields correctly", () => {
    const dbRow = {
      id: "123",
      name: "Test Vendor",
      category: "Venue",
      description: "A great venue",
      location: { city: "Mumbai", state: "Maharashtra" },
      rating: 4.5,
      review_count: 10,
      price_range: "₹50,000 - ₹1,00,000",
      min_price: 50000,
      max_price: 100000,
      cover_image: "https://example.com/image.jpg",
      photos: ["photo1.jpg"],
      completed_bookings: 5,
      gallery: ["gallery1.jpg"],
      contact: { phone: "1234567890", email: "test@test.com" },
      features: [{ id: "f1", title: "AC Hall" }],
      services: [{ id: "s1", title: "Catering" }],
      packages: [{ id: "p1", title: "Silver", price: 50000 }],
      availability: [{ date: "2026-12-01", isAvailable: true }],
      is_available: true,
      featured: true,
      verified: true,
      business_hours: { monday: "9AM-6PM" },
      user_id: "user1",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const result = transformVendorFromDb(dbRow as any);

    expect(result.id).toBe("123");
    expect(result.name).toBe("Test Vendor");
    expect(result.category).toBe("Venue");
    expect(result.rating).toBe(4.5);
    expect(result.reviewCount).toBe(10);
    expect(result.minPrice).toBe(50000);
    expect(result.isAvailable).toBe(true);
    expect(result.featured).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.contact.phone).toBe("1234567890");
    expect(result.contact.email).toBe("test@test.com");
  });

  it("handles null/undefined fields gracefully", () => {
    const dbRow = {
      id: "123",
      name: "Test Vendor",
      category: "Venue",
      description: "A great venue",
      location: "Mumbai",
      rating: null,
      review_count: null,
      price_range: "₹50,000 - ₹1,00,000",
      cover_image: "https://example.com/image.jpg",
      contact: {},
    };

    const result = transformVendorFromDb(dbRow as any);
    expect(result.rating).toBe(0);
    expect(result.reviewCount).toBe(0);
    expect(result.photos).toEqual([]);
    expect(result.gallery).toEqual([]);
    expect(result.features).toEqual([]);
    expect(result.services).toEqual([]);
    expect(result.packages).toEqual([]);
    expect(result.availability).toEqual([]);
    expect(result.isAvailable).toBe(true);
    expect(result.completedBookings).toBe(0);
  });
});

describe("transformReviewFromDb", () => {
  it("transforms review fields", () => {
    const dbRow = {
      id: "r1",
      vendor_id: "v1",
      user_id: "u1",
      user_name: "John Doe",
      rating: 5,
      comment: "Excellent!",
      photos: ["photo1.jpg"],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const result = transformReviewFromDb(dbRow as any);
    expect(result.id).toBe("r1");
    expect(result.vendorId).toBe("v1");
    expect(result.rating).toBe(5);
    expect(result.photos).toEqual(["photo1.jpg"]);
  });

  it("handles missing photos", () => {
    const dbRow = {
      id: "r1",
      vendor_id: "v1",
      user_id: "u1",
      user_name: "John Doe",
      rating: 5,
      comment: "Excellent!",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const result = transformReviewFromDb(dbRow as any);
    expect(result.photos).toEqual([]);
  });
});

describe("transformBudgetFromDb", () => {
  it("transforms budget with nested expenses", () => {
    const dbRow = {
      id: "b1",
      category: "Venue",
      estimated: 500000,
      spent: 200000,
      budget_expenses: [
        { id: "e1", name: "Deposit", amount: 100000, date: "2026-01-01T00:00:00.000Z", paid: true },
        { id: "e2", name: "Balance", amount: 100000, date: "2026-02-01T00:00:00.000Z", paid: false },
      ],
    };

    const result = transformBudgetFromDb(dbRow as any);
    expect(result.id).toBe("b1");
    expect(result.category).toBe("Venue");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("Deposit");
    expect(result.items[0].paid).toBe(true);
    expect(result.items[1].amount).toBe(100000);
  });

  it("handles missing budget_expenses", () => {
    const dbRow = { id: "b1", category: "Venue", estimated: 500000, spent: 0 };
    const result = transformBudgetFromDb(dbRow as any);
    expect(result.items).toEqual([]);
  });
});

describe("transformProfileToUser", () => {
  it("transforms profile with partner info", () => {
    const profile = {
      id: "u1",
      email: "test@test.com",
      name: "Test User",
      wedding_date: "2026-12-01T00:00:00.000Z",
      partner_name: "Partner",
      partner_email: "partner@test.com",
    };

    const result = transformProfileToUser(profile as any);
    expect(result.id).toBe("u1");
    expect(result.weddingDate).toBe("2026-12-01T00:00:00.000Z");
    expect(result.partner?.name).toBe("Partner");
    expect(result.partner?.email).toBe("partner@test.com");
  });

  it("handles missing partner info", () => {
    const profile = {
      id: "u1",
      email: "test@test.com",
      name: "Test User",
    };

    const result = transformProfileToUser(profile as any);
    expect(result.partner).toBeUndefined();
    expect(result.weddingDate).toBeUndefined();
  });
});