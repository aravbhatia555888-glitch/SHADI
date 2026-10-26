import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import Card from "@/components/Card";

describe("Card", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(
      <Card>
        <></>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders null children without crashing", () => {
    const { toJSON } = render(<Card />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders text children", () => {
    const { getByText } = render(
      <Card>
        <Text>Hello World</Text>
      </Card>
    );
    expect(getByText("Hello World")).toBeTruthy();
  });

  it("renders with default variant", () => {
    const { getByText } = render(
      <Card>
        <Text>Default Card</Text>
      </Card>
    );
    expect(getByText("Default Card")).toBeTruthy();
  });

  it("renders with elevated variant", () => {
    const { getByText } = render(
      <Card variant="elevated">
        <Text>Elevated Card</Text>
      </Card>
    );
    expect(getByText("Elevated Card")).toBeTruthy();
  });

  it("renders with outlined variant", () => {
    const { getByText } = render(
      <Card variant="outlined">
        <Text>Outlined Card</Text>
      </Card>
    );
    expect(getByText("Outlined Card")).toBeTruthy();
  });

  it("applies custom style", () => {
    const { getByText } = render(
      <Card style={{ marginTop: 10 }}>
        <Text>Styled Card</Text>
      </Card>
    );
    expect(getByText("Styled Card")).toBeTruthy();
  });

  it("applies custom testID", () => {
    const { getByTestId } = render(
      <Card testID="card-1">
        <Text>Test Card</Text>
      </Card>
    );
    expect(getByTestId("card-1")).toBeTruthy();
  });

  it("applies custom accessibility label", () => {
    const { getByLabelText } = render(
      <Card accessibilityLabel="Wedding card">
        <Text>Card content</Text>
      </Card>
    );
    expect(getByLabelText("Wedding card")).toBeTruthy();
  });

  it("accepts accessibilityRole prop", () => {
    const { getByText } = render(
      <Card accessibilityRole="summary">
        <Text>Summary Card</Text>
      </Card>
    );
    expect(getByText("Summary Card")).toBeTruthy();
  });

  it("renders nested children", () => {
    const { getByText, getByTestId } = render(
      <Card>
        <Card testID="nested-card">
          <Text>Nested</Text>
        </Card>
      </Card>
    );
    expect(getByText("Nested")).toBeTruthy();
    expect(getByTestId("nested-card")).toBeTruthy();
  });

  it("renders multiple children", () => {
    const { toJSON } = render(
      <Card>
        <></>
        <></>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });
});
