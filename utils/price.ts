/**
 * Parse a display price string like "₹50k - ₹2L" or "₹50,000" into a number.
 * Handles the k (thousand) and L (lakh) suffixes used across the app.
 */
export function parsePriceString(priceStr: string): number {
  const cleaned = priceStr.replace(/[₹,\s]/g, "");
  const match = cleaned.match(/([\d.]+)\s*([kKlL])?/);
  if (!match) return parseInt(cleaned, 10) || 0;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toLowerCase();
  if (suffix === "k") return num * 1000;
  if (suffix === "l") return num * 100000;
  return num;
}
