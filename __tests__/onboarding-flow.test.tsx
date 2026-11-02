import React from "react";
import { AccessibilityInfo } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("@/services/ai-checklist", () => ({
  generateSmartChecklist: jest.fn(async () => ({ tasks: [], wasFallback: true })),
}));

jest.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    user: { id: "test-user-id", role: "couple" },
    setRole: jest.fn(async () => ({ success: true })),
  }),
}));

jest.mock("@/stores/wedding-store", () => ({
  useWeddingStore: () => ({
    setWeddingDetails: jest.fn(async () => ({ success: true })),
    addChecklistItem: jest.fn(async () => ({ success: true })),
  }),
}));

jest.mock("@/utils/onboarding", () => ({
  markOnboardingComplete: jest.fn(async () => undefined),
}));

import OnboardingScreen from "@/app/onboarding/index";
import { markOnboardingComplete } from "@/utils/onboarding";

beforeAll(() => {
  try {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({
        remove: jest.fn(),
      } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
  } catch {
    // The jest preset may already provide these.
  }
});

describe("Onboarding flow", () => {
  it("shows the welcome step", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText("Plan your wedding, beautifully.")).toBeTruthy();
    expect(getByText("Get started")).toBeTruthy();
  });

  it("asks who is joining after Get started", () => {
    const { getByText, getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Get started"));
    expect(getByText("What brings you here?")).toBeTruthy();
  });

  it("shows the couple step after choosing 'planning a wedding'", () => {
    const { getByText, getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Get started"));
    fireEvent.press(getByLabelText(/planning a wedding/i));
    expect(getByText("Who's getting married?")).toBeTruthy();
  });

  it("blocks continuing without names", () => {
    const { getByText, getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Get started"));
    fireEvent.press(getByLabelText(/planning a wedding/i));
    fireEvent.press(getByLabelText("Continue"));
    expect(
      getByText("Add your names so we can personalise your plan.")
    ).toBeTruthy();
  });

  it("asks for a date once names are entered", () => {
    const { getByText, getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Get started"));
    fireEvent.press(getByLabelText(/planning a wedding/i));
    fireEvent.changeText(getByLabelText("Couple names"), "Aarav & Priya");
    fireEvent.press(getByLabelText("Continue"));
    expect(
      getByText("Pick your wedding date to build the right timeline.")
    ).toBeTruthy();
  });

  it("returns to the welcome step on back", () => {
    const { getByText, getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Get started"));
    fireEvent.press(getByLabelText("Go back"));
    expect(getByText("Plan your wedding, beautifully.")).toBeTruthy();
  });

  it("marks onboarding complete when skipping", async () => {
    const markComplete = markOnboardingComplete as jest.MockedFunction<
      typeof markOnboardingComplete
    >;
    const { getByLabelText } = render(<OnboardingScreen />);
    fireEvent.press(getByLabelText("Skip setup and explore"));
    await waitFor(() =>
      expect(markComplete).toHaveBeenCalledWith("test-user-id")
    );
  });
});
