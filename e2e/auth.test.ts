import { by, device, element, expect } from "detox";

describe("Authentication Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show login screen on launch", async () => {
    await expect(element(by.text("Welcome Back"))).toBeVisible();
    await expect(element(by.text("Sign In"))).toBeVisible();
  });

  it("should show validation errors for empty fields", async () => {
    await element(by.text("Sign In")).tap();
    await expect(element(by.text(/email/i))).toBeVisible();
  });

  it("should show signup screen when tapping Create Account", async () => {
    await element(by.text("Create Account")).tap();
    await expect(element(by.text("Create Account"))).toBeVisible();
  });

  it("should navigate back to login from signup", async () => {
    await element(by.text("Sign In")).tap();
    await expect(element(by.text("Welcome Back"))).toBeVisible();
  });
});
