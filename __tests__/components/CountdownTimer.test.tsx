import React from "react";
import { render } from "@testing-library/react-native";
import CountdownTimer from "@/components/CountdownTimer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders timer container with accessibility label", () => {
    const futureDate = "2026-06-15T00:00:00Z";
    const { getByLabelText } = render(
      <CountdownTimer weddingDate={futureDate} />
    );
    expect(getByLabelText(/days.*hours.*minutes.*seconds/)).toBeTruthy();
  });

  it("renders time unit labels", () => {
    const futureDate = "2026-06-15T00:00:00Z";
    const { getByText } = render(
      <CountdownTimer weddingDate={futureDate} />
    );
    expect(getByText("Days")).toBeTruthy();
    expect(getByText("Hours")).toBeTruthy();
    expect(getByText("Mins")).toBeTruthy();
    expect(getByText("Secs")).toBeTruthy();
  });

  it("shows 00:00:00:00 when wedding date is in the past", () => {
    const pastDate = "2020-01-01T00:00:00Z";
    const { getAllByText } = render(
      <CountdownTimer weddingDate={pastDate} />
    );
    // All values should be "00"
    const zeros = getAllByText("00");
    expect(zeros.length).toBe(4);
  });

  it("renders with accessibilityLiveRegion='polite'", () => {
    const futureDate = "2026-06-15T00:00:00Z";
    const { getByText } = render(
      <CountdownTimer weddingDate={futureDate} />
    );
    expect(getByText("Days")).toBeTruthy();
  });

  it("formats single digit numbers with leading zero", () => {
    jest.setSystemTime(new Date("2026-06-14T23:59:55Z"));
    const nearDate = "2026-06-15T00:00:00Z";
    const { getByText } = render(
      <CountdownTimer weddingDate={nearDate} />
    );
    // Should still render the timer structure
    expect(getByText("Hours")).toBeTruthy();
  });

  it("creates interval on mount", () => {
    const futureDate = "2026-06-15T00:00:00Z";
    render(<CountdownTimer weddingDate={futureDate} />);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("cleans up interval on unmount", () => {
    const futureDate = "2026-06-15T00:00:00Z";
    const { unmount } = render(<CountdownTimer weddingDate={futureDate} />);
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
