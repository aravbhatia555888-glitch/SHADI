import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ReviewItemComponent from "@/components/ReviewItem";

const ReviewItem = ReviewItemComponent;

const mockReview = {
  id: "1",
  vendorId: "v1",
  userId: "u1",
  rating: 4,
  title: "Great venue",
  content:
    "This venue was absolutely amazing for our wedding. The staff was very professional and the location was perfect.",
  helpful: 3,
  edited: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const longReview = {
  ...mockReview,
  content: "A".repeat(200),
};

describe("ReviewItem", () => {
  it("renders review title", () => {
    const { getByText } = render(
      <ReviewItem review={mockReview} isUserReview={false} />
    );
    expect(getByText("Great venue")).toBeTruthy();
  });

  it("renders review content", () => {
    const { getByText } = render(
      <ReviewItem review={mockReview} isUserReview={false} />
    );
    expect(getByText(/This venue was absolutely amazing/)).toBeTruthy();
  });

  it("renders user avatar with initials", () => {
    const { getByText } = render(
      <ReviewItem review={mockReview} isUserReview={false} />
    );
    expect(getByText("AN")).toBeTruthy();
  });

  it("shows 'edited' indicator when review has been edited", () => {
    const editedReview = { ...mockReview, edited: true };
    const { getByText } = render(
      <ReviewItem review={editedReview} isUserReview={false} />
    );
    expect(getByText(/edited/)).toBeTruthy();
  });

  it("shows 'Read More' button for long reviews", () => {
    const { getByText } = render(
      <ReviewItem review={longReview} isUserReview={false} />
    );
    expect(getByText("Read More")).toBeTruthy();
  });

  it("expands and collapses long review text", () => {
    const { getByText, queryByText } = render(
      <ReviewItem review={longReview} isUserReview={false} />
    );

    // Initially shows truncated content with Read More button
    expect(getByText("Read More")).toBeTruthy();

    // Press Read More to expand
    fireEvent.press(getByText("Read More"));
    expect(getByText("Read Less")).toBeTruthy();

    // Press Read Less to collapse
    fireEvent.press(getByText("Read Less"));
    expect(getByText("Read More")).toBeTruthy();
  });

  it("shows action menu for user's own reviews", () => {
    const { getByLabelText } = render(
      <ReviewItem review={mockReview} isUserReview={true} />
    );
    expect(getByLabelText("Review options")).toBeTruthy();
  });

  it("shows edit and delete buttons when actions menu is opened", () => {
    const { getByLabelText, getByText } = render(
      <ReviewItem review={mockReview} isUserReview={true} />
    );

    fireEvent.press(getByLabelText("Review options"));
    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });

  it("calls onEdit when edit button is pressed", () => {
    const onEdit = jest.fn();
    const { getByLabelText, getByText } = render(
      <ReviewItem review={mockReview} isUserReview={true} onEdit={onEdit} />
    );

    fireEvent.press(getByLabelText("Review options"));
    fireEvent.press(getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("calls onHelpful when helpful button is pressed", () => {
    const onHelpful = jest.fn();
    const { getByLabelText } = render(
      <ReviewItem
        review={mockReview}
        isUserReview={false}
        onHelpful={onHelpful}
      />
    );

    fireEvent.press(getByLabelText("Mark as helpful"));
    expect(onHelpful).toHaveBeenCalledWith(true);
  });

  it("shows helpful count", () => {
    const { getByText } = render(
      <ReviewItem
        review={mockReview}
        isUserReview={false}
        onHelpful={() => {}}
      />
    );
    expect(getByText("3 found this helpful")).toBeTruthy();
  });

  it("does not show helpful section for user's own reviews", () => {
    const { queryByText } = render(
      <ReviewItem review={mockReview} isUserReview={true} />
    );
    expect(queryByText("Was this helpful?")).toBeNull();
  });

  it("does not show rating for user reviews", () => {
    const noHelpfulReview = { ...mockReview, helpful: 0 };
    const { queryByText } = render(
      <ReviewItem
        review={noHelpfulReview}
        isUserReview={false}
        onHelpful={() => {}}
      />
    );
    // Should not show helpful count when 0
    expect(queryByText("0 found this helpful")).toBeNull();
  });

  it("applies custom testID", () => {
    const { getByTestId } = render(
      <ReviewItem review={mockReview} isUserReview={false} testID="review-item" />
    );
    expect(getByTestId("review-item")).toBeTruthy();
  });
});
