/**
 * Vendor comparison helper tests.
 */

import type { Vendor } from "@/schemas/wedding";
import {
  getBestRatedVendor,
  getBestValueVendor,
  getVerifiedVendors,
  getVendorComparisonSummary,
  getVendorPrice,
} from "@/utils/vendor-comparison";

function makeVendor(overrides: Partial<Vendor>): Vendor {
  return {
    id: "v1",
    name: "Vendor",
    category: "Venue",
    description: "desc",
    location: { city: "Mumbai", state: "Maharashtra" },
    rating: 4.5,
    reviewCount: 10,
    priceRange: "₹50,000 - ₹1,00,000",
    coverImage: "https://example.com/img.jpg",
    photos: [],
    completedBookings: 0,
    gallery: [],
    contact: { phone: "", email: "" },
    features: [],
    services: [],
    packages: [],
    isAvailable: true,
    featured: false,
    ...overrides,
  };
}

describe("getBestRatedVendor", () => {
  it("returns the highest-rated vendor", () => {
    const vendors = [
      makeVendor({ id: "a", name: "A", rating: 4.2 }),
      makeVendor({ id: "b", name: "B", rating: 4.9 }),
      makeVendor({ id: "c", name: "C", rating: 3.8 }),
    ];
    expect(getBestRatedVendor(vendors)?.name).toBe("B");
  });

  it("breaks ties by review count", () => {
    const vendors = [
      makeVendor({ id: "a", name: "A", rating: 4.5, reviewCount: 5 }),
      makeVendor({ id: "b", name: "B", rating: 4.5, reviewCount: 200 }),
    ];
    expect(getBestRatedVendor(vendors)?.name).toBe("B");
  });

  it("returns null for an empty list", () => {
    expect(getBestRatedVendor([])).toBeNull();
  });
});

describe("getVendorPrice / getBestValueVendor", () => {
  it("uses minPrice when present", () => {
    expect(getVendorPrice(makeVendor({ minPrice: 25000 }))).toBe(25000);
  });

  it("parses k/L price ranges when minPrice is absent", () => {
    expect(getVendorPrice(makeVendor({ priceRange: "₹50k - ₹2L" }))).toBe(50000);
    expect(getVendorPrice(makeVendor({ priceRange: "₹2,00,000 - ₹5,00,000" }))).toBe(200000);
  });

  it("ignores a minPrice of 0 (transform default for missing DB price)", () => {
    // transformVendorFromDb maps missing min_price -> 0, which must NOT be
    // treated as "free/cheapest" — the priceRange parse should win.
    const vendor = makeVendor({ minPrice: 0, priceRange: "₹2L - ₹5L" });
    expect(getVendorPrice(vendor)).toBe(200000);
  });

  it("picks the cheapest vendor (with k/L parsing)", () => {
    const vendors = [
      makeVendor({ id: "a", name: "Cheap", priceRange: "₹15k - ₹30k" }),
      makeVendor({ id: "b", name: "Pricy", priceRange: "₹1L - ₹3L" }),
      makeVendor({ id: "c", name: "Pricier", minPrice: 500000 }),
    ];
    expect(getBestValueVendor(vendors)?.name).toBe("Cheap");
  });
});

describe("getVerifiedVendors", () => {
  it("returns only verified vendors", () => {
    const vendors = [
      makeVendor({ id: "a", name: "V", verified: true }),
      makeVendor({ id: "b", name: "U", verified: false }),
      makeVendor({ id: "c", name: "V2", verified: true }),
    ];
    const verified = getVerifiedVendors(vendors);
    expect(verified.map((v) => v.id)).toEqual(["a", "c"]);
  });
});

describe("getVendorComparisonSummary", () => {
  it("builds a complete summary", () => {
    const vendors = [
      makeVendor({ id: "a", name: "A", rating: 4.9, priceRange: "₹2L+" }),
      makeVendor({ id: "b", name: "B", rating: 4.0, priceRange: "₹20k - ₹50k" }),
      makeVendor({ id: "c", name: "C", rating: 4.5, priceRange: "₹50k - ₹1L", verified: true }),
    ];
    const summary = getVendorComparisonSummary(vendors);
    expect(summary).not.toBeNull();
    expect(summary!.bestRated.name).toBe("A");
    expect(summary!.bestValue.name).toBe("B");
    expect(summary!.verifiedVendors.map((v) => v.name)).toEqual(["C"]);
    expect(summary!.anyVerified).toBe(true);
  });

  it("returns null for an empty list", () => {
    expect(getVendorComparisonSummary([])).toBeNull();
  });
});
