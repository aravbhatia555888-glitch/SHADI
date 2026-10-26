import { by, device, element, expect } from "detox";

describe("Vendor Browsing", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should display vendor list", async () => {
    await element(by.id("tab-vendors")).tap();
    await expect(element(by.text("Vendors"))).toBeVisible();
  });

  it("should show search bar", async () => {
    await element(by.id("tab-vendors")).tap();
    await expect(element(by.id("vendor-search-input"))).toBeVisible();
  });

  it("should filter by category", async () => {
    await element(by.id("tab-vendors")).tap();
    await element(by.text("Venues")).tap();
  });

  it("should open vendor detail on tap", async () => {
    await element(by.id("tab-vendors")).tap();
    const vendorCards = element(by.id("vendor-card"));
    await vendorCards.atIndex(0).tap();
    await expect(element(by.text("Book Now"))).toBeVisible();
  });
});
