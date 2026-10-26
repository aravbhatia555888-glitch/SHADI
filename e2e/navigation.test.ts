import { by, device, element, expect } from "detox";

describe("Navigation", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should have tab navigation after login", async () => {
    await expect(element(by.id("tab-home"))).toBeVisible();
  });

  it("should navigate to vendors tab", async () => {
    await element(by.id("tab-vendors")).tap();
    await expect(element(by.text("Vendors"))).toBeVisible();
  });

  it("should navigate to checklist tab", async () => {
    await element(by.id("tab-checklist")).tap();
    await expect(element(by.text("Checklist"))).toBeVisible();
  });

  it("should navigate to messages tab", async () => {
    await element(by.id("tab-messages")).tap();
    await expect(element(by.text("Messages"))).toBeVisible();
  });

  it("should navigate to profile tab", async () => {
    await element(by.id("tab-profile")).tap();
    await expect(element(by.text("Profile"))).toBeVisible();
  });
});
