import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "@/components/Button";

describe("Button", () => {
  it("renders with title", () => {
    const { getByText } = render(
      <Button title="Press Me" onPress={() => {}} />
    );
    expect(getByText("Press Me")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPress} />);
    fireEvent.press(getByText("Press Me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button title="Press Me" onPress={onPress} disabled />
    );
    const button = getByRole("button");
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows loading indicator when loading", () => {
    const { queryByText } = render(
      <Button title="Press Me" onPress={() => {}} loading />
    );
    expect(queryByText("Press Me")).toBeNull();
  });

  it("does not call onPress when loading", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button title="Press Me" onPress={onPress} loading />
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders outline variant", () => {
    const { getByText } = render(
      <Button title="Outline" onPress={() => {}} variant="outline" />
    );
    expect(getByText("Outline")).toBeTruthy();
  });

  it("renders secondary variant", () => {
    const { getByText } = render(
      <Button title="Secondary" onPress={() => {}} variant="secondary" />
    );
    expect(getByText("Secondary")).toBeTruthy();
  });

  it("renders ghost variant", () => {
    const { getByText } = render(
      <Button title="Ghost" onPress={() => {}} variant="ghost" />
    );
    expect(getByText("Ghost")).toBeTruthy();
  });

  it("renders with icon on left by default", () => {
    const MockIcon = () => null;
    const { getByText } = render(
      <Button
        title="With Icon"
        onPress={() => {}}
        renderIcon={() => <MockIcon />}
      />
    );
    expect(getByText("With Icon")).toBeTruthy();
  });

  it("renders with icon on right", () => {
    const MockIcon = () => null;
    const { getByText } = render(
      <Button
        title="With Icon"
        onPress={() => {}}
        renderIcon={() => <MockIcon />}
        iconPosition="right"
      />
    );
    expect(getByText("With Icon")).toBeTruthy();
  });

  it("has correct accessibility role", () => {
    const { getByRole } = render(
      <Button title="Accessible" onPress={() => {}} />
    );
    expect(getByRole("button")).toBeTruthy();
  });

  it("has disabled accessibility state when disabled", () => {
    const { getByRole } = render(
      <Button title="Disabled" onPress={() => {}} disabled />
    );
    const button = getByRole("button");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("has busy accessibility state when loading", () => {
    const { getByRole } = render(
      <Button title="Loading" onPress={() => {}} loading />
    );
    const button = getByRole("button");
    expect(button.props.accessibilityState?.busy).toBe(true);
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("renders small size", () => {
    const { getByText } = render(
      <Button title="Small" onPress={() => {}} size="small" />
    );
    expect(getByText("Small")).toBeTruthy();
  });

  it("renders large size", () => {
    const { getByText } = render(
      <Button title="Large" onPress={() => {}} size="large" />
    );
    expect(getByText("Large")).toBeTruthy();
  });

  it("applies custom testID", () => {
    const { getByTestId } = render(
      <Button title="Test" onPress={() => {}} testID="custom-button" />
    );
    expect(getByTestId("custom-button")).toBeTruthy();
  });

  it("uses custom accessibility label", () => {
    const { getByLabelText } = render(
      <Button
        title="Btn"
        onPress={() => {}}
        accessibilityLabel="Custom Label"
      />
    );
    expect(getByLabelText("Custom Label")).toBeTruthy();
  });

  it("defaults accessibility label to title", () => {
    const { getByLabelText } = render(
      <Button title="My Button" onPress={() => {}} />
    );
    expect(getByLabelText("My Button")).toBeTruthy();
  });
});
