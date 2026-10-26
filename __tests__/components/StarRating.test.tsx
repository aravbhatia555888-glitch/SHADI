import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StarRating from "@/components/StarRating";

describe("StarRating", () => {
  it("renders 5 stars by default", () => {
    const { toJSON } = render(<StarRating rating={3} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("renders with custom maxStars", () => {
    const { toJSON } = render(<StarRating rating={3} maxStars={10} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("displays correct rating with testID", () => {
    const { getByTestId } = render(
      <StarRating rating={3.5} testID="star-rating" />
    );
    expect(getByTestId("star-rating")).toBeTruthy();
  });

  it("renders interactive stars with button roles", () => {
    const { getAllByRole } = render(
      <StarRating rating={0} interactive onRatingChange={() => {}} />
    );
    const buttons = getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("calls onRatingChange when interactive star is pressed", () => {
    const onRatingChange = jest.fn();
    const { getAllByRole } = render(
      <StarRating rating={0} interactive onRatingChange={onRatingChange} />
    );
    const buttons = getAllByRole("button");
    fireEvent.press(buttons[2]);
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });

  it("resets rating to 0 when same star is pressed again", () => {
    const onRatingChange = jest.fn();
    const { getAllByRole } = render(
      <StarRating rating={3} interactive onRatingChange={onRatingChange} />
    );
    const buttons = getAllByRole("button");
    fireEvent.press(buttons[2]);
    expect(onRatingChange).toHaveBeenCalledWith(0);
  });

  it("is non-interactive when interactive is false", () => {
    const { queryAllByRole } = render(<StarRating rating={3} />);
    const buttons = queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });

  it("has correct accessibility props when non-interactive", () => {
    const { getByTestId } = render(
      <StarRating rating={3} testID="star-rating" />
    );
    const container = getByTestId("star-rating");
    expect(container.props.accessibilityRole).toBe("text");
    expect(container.props.accessibilityLabel).toContain("3");
  });

  it("has correct accessibility props when interactive", () => {
    const { getByTestId } = render(
      <StarRating
        rating={3}
        interactive
        onRatingChange={() => {}}
        testID="star-rating"
      />
    );
    const container = getByTestId("star-rating");
    expect(container.props.accessibilityRole).toBe("adjustable");
    expect(container.props.accessibilityLabel).toContain("Rating input");
    expect(container.props.accessibilityLabel).toContain("3");
    expect(container.props.accessibilityValue).toEqual({
      min: 0,
      max: 5,
      now: 3,
    });
  });

  it("renders with small size", () => {
    const { getByTestId } = render(
      <StarRating rating={3} size="small" testID="small-stars" />
    );
    expect(getByTestId("small-stars")).toBeTruthy();
  });

  it("renders with medium size", () => {
    const { getByTestId } = render(
      <StarRating rating={3} size="medium" testID="medium-stars" />
    );
    expect(getByTestId("medium-stars")).toBeTruthy();
  });

  it("renders with large size", () => {
    const { getByTestId } = render(
      <StarRating rating={3} size="large" testID="large-stars" />
    );
    expect(getByTestId("large-stars")).toBeTruthy();
  });

  it("renders with zero rating", () => {
    const { getByTestId } = render(
      <StarRating rating={0} testID="zero-stars" />
    );
    expect(getByTestId("zero-stars")).toBeTruthy();
  });

  it("renders with full rating", () => {
    const { getByTestId } = render(
      <StarRating rating={5} testID="full-stars" />
    );
    expect(getByTestId("full-stars")).toBeTruthy();
  });

  it("renders with half-star rating", () => {
    const { getByTestId } = render(
      <StarRating rating={3.5} testID="half-stars" />
    );
    expect(getByTestId("half-stars")).toBeTruthy();
  });

  it("has correct accessibility label when interactive", () => {
    const { getByTestId } = render(
      <StarRating
        rating={3}
        interactive
        onRatingChange={() => {}}
        testID="star-rating"
      />
    );
    const container = getByTestId("star-rating");
    expect(container.props.accessibilityLabel).toContain("Rating input");
    expect(container.props.accessibilityLabel).toContain("3");
    expect(container.props.accessibilityLabel).toContain("5");
  });

  it("has correct accessibility label when non-interactive", () => {
    const { getByTestId } = render(
      <StarRating rating={4} testID="star-rating" />
    );
    const container = getByTestId("star-rating");
    expect(container.props.accessibilityLabel).toContain("4");
    expect(container.props.accessibilityLabel).toContain("5");
  });

  it("does not have accessibilityValue when non-interactive", () => {
    const { getByTestId } = render(
      <StarRating rating={3} testID="star-rating" />
    );
    const container = getByTestId("star-rating");
    expect(container.props.accessibilityValue).toBeUndefined();
  });
});
