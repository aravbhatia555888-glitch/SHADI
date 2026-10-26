jest.mock("expo-device", () => ({ isDevice: false }));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  AndroidImportance: { MAX: 5 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
}));

import { getNotificationRoute } from "@/services/notifications";

describe("notification navigation", () => {
  it.each([
    "/(tabs)/messages",
    "/(tabs)/checklist",
    "/budget",
  ] as const)("allows the known internal route %s", (screen) => {
    expect(getNotificationRoute({ screen })).toBe(screen);
  });

  it.each([
    "https://evil.example",
    "/auth/login",
    "../settings",
    42,
    undefined,
  ])("rejects an untrusted notification route", (screen) => {
    expect(getNotificationRoute({ screen })).toBeNull();
  });
});
