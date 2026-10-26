import { by, device, element, expect } from "detox";

describe("Checklist Management", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should display checklist", async () => {
    await element(by.id("tab-checklist")).tap();
    await expect(element(by.text("Checklist"))).toBeVisible();
  });

  it("should open add task modal", async () => {
    await element(by.id("tab-checklist")).tap();
    await element(by.id("add-task-button")).tap();
    await expect(element(by.text("Add New Task"))).toBeVisible();
  });

  it("should toggle task completion", async () => {
    await element(by.id("tab-checklist")).tap();
    const firstTask = element(by.id("checklist-toggle")).atIndex(0);
    await firstTask.tap();
  });
});
