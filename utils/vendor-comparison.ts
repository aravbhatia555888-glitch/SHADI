/**
 * Vendor comparison helpers — pure functions used by the compare screen.
 * Extracted so the recommendation logic is unit-testable.
 */

import type { Vendor } from "@/schemas/wedding";
import { parsePriceString } from "@/utils/price";

export interface VendorComparisonSummary {
  bestRated: Vendor;
  bestValue: Vendor;
  verifiedVendors: Vendor[];
  anyVerified: boolean;
}

/** Best overall = highest rating, ties broken by review count. */
export function getBestRatedVendor(vendors: Vendor[]): Vendor | null {
  if (vendors.length === 0) return null;
  return [...vendors].sort(
    (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
  )[0];
}

/**
 * Best value = lowest minimum price (falls back to parsed priceRange).
 *
 * NOTE: transformVendorFromDb maps a missing min_price column to minPrice: 0,
 * so a positive-number check is required — otherwise every vendor without a
 * DB price would sort as "cheapest" and win the best-value recommendation.
 */
export function getVendorPrice(vendor: Vendor): number {
  return typeof vendor.minPrice === "number" && vendor.minPrice > 0
    ? vendor.minPrice
    : parsePriceString(vendor.priceRange || "0");
}

export function getBestValueVendor(vendors: Vendor[]): Vendor | null {
  if (vendors.length === 0) return null;
  return [...vendors].sort(
    (a, b) => getVendorPrice(a) - getVendorPrice(b)
  )[0];
}

export function getVerifiedVendors(vendors: Vendor[]): Vendor[] {
  return vendors.filter((v) => v.verified);
}

/**
 * Build the full summary used by the compare screen.
 * Callers must pass at least one vendor (the screen guards with >= 2).
 */
export function getVendorComparisonSummary(
  vendors: Vendor[]
): VendorComparisonSummary | null {
  if (vendors.length === 0) return null;
  const bestRated = getBestRatedVendor(vendors);
  const bestValue = getBestValueVendor(vendors);
  const verifiedVendors = getVerifiedVendors(vendors);

  return {
    bestRated: bestRated as Vendor,
    bestValue: bestValue as Vendor,
    verifiedVendors,
    anyVerified: verifiedVendors.length > 0,
  };
}
