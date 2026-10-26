import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ChecklistItemComponent from "@/components/ChecklistItem";

const mockItem = {
  id: "1",
  title: "Book Venue",
  description: "Find and book the perfect venue",
  category: "Venue",
  dueDate: "2026-06-15",
  completed: false,
  priority: "high" as const,
};

describe("ChecklistItem", () => {
  it("renders item title", () => {
    const { getByText } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    expect(getByText("Book Venue")).toBeTruthy();
  });

  it("renders item category", () => {
    const { getByText } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    expect(getByText("Venue")).toBeTruthy();
  });

  it("renders formatted due date", () => {
    const { getByText } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    expect(getByText("Jun 15")).toBeTruthy();
  });

  it("has checkbox accessibility role", () => {
    const { getByRole } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    expect(getByRole("checkbox")).toBeTruthy();
  });

  it("has unchecked accessibility state when not completed", () => {
    const { getByRole } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    const checkbox = getByRole("checkbox");
    expect(checkbox.props.accessibilityState?.checked).toBe(false);
  });

  it("has checked accessibility state when completed", () => {
    const completedItem = { ...mockItem, completed: true };
    const { getByRole } = render(
      <ChecklistItemComponent item={completedItem} onToggle={() => {}} />
    );
    const checkbox = getByRole("checkbox");
    expect(checkbox.props.accessibilityState?.checked).toBe(true);
  });

  it("calls onToggle with id and new status when pressed", () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      <ChecklistItemComponent item={mockItem} onToggle={onToggle} />
    );
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  it("calls onToggle with false when completing an already completed item", () => {
    const onToggle = jest.fn();
    const completedItem = { ...mockItem, completed: true };
    const { getByRole } = render(
      <ChecklistItemComponent item={completedItem} onToggle={onToggle} />
    );
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(onToggle).toHaveBeenCalledWith("1", false);
  });

  it("has correct accessibility label with due date", () => {
    const { getByRole } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    const checkbox = getByRole("checkbox");
    expect(checkbox.props.accessibilityLabel).toContain("Book Venue");
    expect(checkbox.props.accessibilityLabel).toContain("Jun 15");
  });

  it("renders different priority items", () => {
    const mediumItem = { ...mockItem, priority: "medium" as const };
    const { getByText } = render(
      <ChecklistItemComponent item={mediumItem} onToggle={() => {}} />
    );
    expect(getByText("Book Venue")).toBeTruthy();
  });

  it("renders low priority items", () => {
    const lowItem = { ...mockItem, priority: "low" as const };
    const { getByText } = render(
      <ChecklistItemComponent item={lowItem} onToggle={() => {}} />
    );
    expect(getByText("Book Venue")).toBeTruthy();
  });

  it("handles item with past due date", () => {
    const pastDueItem = { ...mockItem, dueDate: "2020-01-01" };
    const { getByText } = render(
      <ChecklistItemComponent item={pastDueItem} onToggle={() => {}} />
    );
    expect(getByText("Book Venue")).toBeTruthy();
  });

  it("updates visual state when item.completed prop changes", () => {
    const { getByRole, rerender } = render(
      <ChecklistItemComponent item={mockItem} onToggle={() => {}} />
    );
    expect(getByRole("checkbox").props.accessibilityState?.checked).toBe(false);

    const completedItem = { ...mockItem, completed: true };
    rerender(
      <ChecklistItemComponent item={completedItem} onToggle={() => {}} />
    );
    expect(getByRole("checkbox").props.accessibilityState?.checked).toBe(true);
  });
});
