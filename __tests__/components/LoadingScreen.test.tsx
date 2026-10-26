import React from "react";
import { render } from "@testing-library/react-native";
import LoadingScreen from "@/components/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders without message", () => {
    const { getByLabelText } = render(<LoadingScreen />);
    expect(getByLabelText("Loading")).toBeTruthy();
  });

  it("renders with message", () => {
    const { getByText, getByLabelText } = render(
      <LoadingScreen message="Loading your wedding details..." />
    );
    expect(getByText("Loading your wedding details...")).toBeTruthy();
    expect(getByLabelText("Loading")).toBeTruthy();
  });

  it("has loading accessibility label", () => {
    const { getByLabelText } = render(<LoadingScreen />);
    expect(getByLabelText("Loading")).toBeTruthy();
  });

  it("does not render message text when not provided", () => {
    const { queryByText } = render(<LoadingScreen />);
    expect(queryByText(/./)).toBeNull();
  });

  it("renders with different messages", () => {
    const { getByText, rerender } = render(
      <LoadingScreen message="Loading..." />
    );
    expect(getByText("Loading...")).toBeTruthy();

    rerender(<LoadingScreen message="Please wait..." />);
    expect(getByText("Please wait...")).toBeTruthy();
  });
});
