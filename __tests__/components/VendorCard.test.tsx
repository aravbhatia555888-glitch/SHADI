import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import VendorCard from "@/components/VendorCard";

const mockVendor = {
  id: "1",
  name: "Royal Palace",
  category: "Venue",
  description: "A beautiful venue",
  location: { address: "123 St", city: "Mumbai", state: "Maharashtra", country: "India", pincode: "400001", latitude: 19.076, longitude: 72.8777 },
  rating: 4.5,
  reviewCount: 100,
  priceRange: "₹2,00,000 - ₹5,00,000",
  minPrice: 200000,
  maxPrice: 500000,
  coverImage: "https://example.com/image.jpg",
  photos: ["photo1.jpg", "photo2.jpg"],
  completedBookings: 50,
  gallery: [],
  contact: { phone: "+91-123", email: "test@test.com" },
  features: [],
  services: [],
  packages: [],
  availability: [],
  isAvailable: true,
  featured: true,
  verified: true,
  businessHours: undefined,
  createdAt: undefined,
  updatedAt: undefined,
};

describe("VendorCard", () => {
  it("renders vendor name", () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByText("Royal Palace")).toBeTruthy();
  });

  it("renders vendor location string when location is an object", () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByText("Mumbai, Maharashtra")).toBeTruthy();
  });

  it("renders vendor location directly when location is a string", () => {
    const stringVendor = { ...mockVendor, location: "Mumbai, Maharashtra" };
    const { getByText } = render(
      <VendorCard vendor={stringVendor} onPress={() => {}} />
    );
    expect(getByText("Mumbai, Maharashtra")).toBeTruthy();
  });

  it("renders price range", () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByText("₹2,00,000 - ₹5,00,000")).toBeTruthy();
  });

  it("renders rating", () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByText("4.5")).toBeTruthy();
  });

  it("calls onPress with vendor when tapped", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <VendorCard vendor={mockVendor} onPress={onPress} />
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledWith(mockVendor);
  });

  it("has correct accessibility label", () => {
    const { getByRole } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByRole("button").props.accessibilityLabel).toContain("Royal Palace");
  });

  it("hides rating when showRating is false", () => {
    const { queryByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} showRating={false} />
    );
    expect(queryByText("4.5")).toBeNull();
  });

  it("hides price range when showPriceRange is false", () => {
    const { queryByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} showPriceRange={false} />
    );
    expect(queryByText("₹2,00,000 - ₹5,00,000")).toBeNull();
  });

  it("renders photo count", () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );
    expect(getByText("2 Photos")).toBeTruthy();
  });

  it("applies custom testID", () => {
    const { getByTestId } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} testID="vendor-1" />
    );
    expect(getByTestId("vendor-1")).toBeTruthy();
  });
});
