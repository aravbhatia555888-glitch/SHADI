import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ReviewSummary from "@/components/ReviewSummary";

const mockDistribution = {
  1: 5,
  2: 3,
  3: 10,
  4: 25,
  5: 57,
  total: 100,
  average: 4.3,
};

describe("ReviewSummary", () => {
  it("renders average rating", () => {
    const { getByText } = render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={100}
        ratingDistribution={mockDistribution}
      />
    );
    expect(getByText("4.3")).toBeTruthy();
  });

  it("renders total reviews count", () => {
    const { getByText } = render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={100}
        ratingDistribution={mockDistribution}
      />
    );
    expect(getByText("100 reviews")).toBeTruthy();
  });

  it("renders singular review when total is 1", () => {
    const singleDist = { ...mockDistribution, total: 1, average: 5 };
    const { getByText } = render(
      <ReviewSummary
        averageRating={5}
        totalReviews={1}
        ratingDistribution={singleDist}
      />
    );
    expect(getByText("1 review")).toBeTruthy();
  });

  it("renders rating distribution bars", () => {
    const { getAllByText } = render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={100}
        ratingDistribution={mockDistribution}
      />
    );
    // "5" could match both star label and count label, so use getAllByText
    [5, 4, 3, 2, 1].forEach((star) => {
      const matches = getAllByText(star.toString());
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders count labels for each star level", () => {
    const { getByText } = render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={100}
        ratingDistribution={mockDistribution}
      />
    );
    expect(getByText("57")).toBeTruthy();
    expect(getByText("25")).toBeTruthy();
    expect(getByText("10")).toBeTruthy();
  });

  it("handles zero total reviews without dividing by zero", () => {
    const zeroDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0, average: 0 };
    const { getByText } = render(
      <ReviewSummary
        averageRating={0}
        totalReviews={0}
        ratingDistribution={zeroDist}
      />
    );
    expect(getByText("0.0")).toBeTruthy();
    expect(getByText("0 reviews")).toBeTruthy();
  });

  it("applies custom testID", () => {
    const { getByTestId } = render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={100}
        ratingDistribution={mockDistribution}
        testID="review-summary"
      />
    );
    expect(getByTestId("review-summary")).toBeTruthy();
  });
});
