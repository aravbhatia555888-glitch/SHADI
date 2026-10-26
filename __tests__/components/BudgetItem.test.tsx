import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BudgetItemComponent from "@/components/BudgetItem";

const mockBudgetItem = {
  id: "1",
  category: "Venue",
  estimated: 500000,
  spent: 250000,
  items: [
    {
      id: "1",
      name: "Advance Payment",
      amount: 250000,
      date: "2026-01-15",
      paid: true,
    },
  ],
};

describe("BudgetItem", () => {
  it("renders category name", () => {
    const { getByText } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByText("Venue")).toBeTruthy();
  });

  it("renders spent amount", () => {
    const { getByText } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByText(/2,50,000/)).toBeTruthy();
  });

  it("renders estimated amount", () => {
    const { getByText } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByText(/5,00,000/)).toBeTruthy();
  });

  it("renders item count", () => {
    const { getByText } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByText("1 items")).toBeTruthy();
  });

  it("renders percentage used status", () => {
    const { getByText } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByText("50% used")).toBeTruthy();
  });

  it("has progressbar with correct accessibility value", () => {
    const { getByTestId } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    const progressbar = getByTestId("budget-progressbar");
    expect(progressbar).toBeTruthy();
  });

  it("has button accessibility role on container", () => {
    const { getByTestId } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    expect(getByTestId("budget-item")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={onPress} />
    );
    fireEvent.press(getByTestId("budget-item"));
    expect(onPress).toHaveBeenCalledWith(mockBudgetItem);
  });

  it("handles zero estimated budget without division error", () => {
    const zeroBudget = { ...mockBudgetItem, estimated: 0, spent: 0 };
    expect(() => {
      render(<BudgetItemComponent item={zeroBudget} onPress={() => {}} />);
    }).not.toThrow();
  });

  it("shows no budget set status when estimated is zero", () => {
    const zeroBudget = { ...mockBudgetItem, estimated: 0, spent: 0, items: [] };
    const { getByText } = render(
      <BudgetItemComponent item={zeroBudget} onPress={() => {}} />
    );
    expect(getByText("No budget set")).toBeTruthy();
  });

  it("shows over budget status when spent exceeds estimated", () => {
    const overBudget = { ...mockBudgetItem, estimated: 100000, spent: 150000 };
    const { getByText } = render(
      <BudgetItemComponent item={overBudget} onPress={() => {}} />
    );
    expect(getByText("Over budget")).toBeTruthy();
  });

  it("handles multiple expense items", () => {
    const multiItem = {
      ...mockBudgetItem,
      items: [
        {
          id: "1",
          name: "Advance",
          amount: 100000,
          date: "2026-01-15",
          paid: true,
        },
        {
          id: "2",
          name: "Security",
          amount: 50000,
          date: "2026-02-15",
          paid: false,
        },
        {
          id: "3",
          name: "Final",
          amount: 100000,
          date: "2026-06-15",
          paid: false,
        },
      ],
    };
    const { getByText } = render(
      <BudgetItemComponent item={multiItem} onPress={() => {}} />
    );
    expect(getByText("3 items")).toBeTruthy();
  });

  it("has correct accessibility label", () => {
    const { getByTestId } = render(
      <BudgetItemComponent item={mockBudgetItem} onPress={() => {}} />
    );
    const item = getByTestId("budget-item");
    expect(item.props.accessibilityLabel).toContain("Venue");
    expect(item.props.accessibilityLabel).toContain("2,50,000");
    expect(item.props.accessibilityLabel).toContain("5,00,000");
  });

  it("renders with empty items array", () => {
    const emptyItem = { ...mockBudgetItem, items: [] };
    const { getByText } = render(
      <BudgetItemComponent item={emptyItem} onPress={() => {}} />
    );
    expect(getByText("0 items")).toBeTruthy();
  });
});
