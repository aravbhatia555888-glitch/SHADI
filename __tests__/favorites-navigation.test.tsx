import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import ProfileScreen from "../app/(tabs)/profile";
import { useWeddingStore } from "../stores/wedding-store";

// Mock the router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useNavigation: jest.fn(() => ({
    setOptions: jest.fn(),
  })),
  useFocusEffect: jest.fn(),
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

// Mock the wedding store
const mockWeddingStoreState = {
  weddingDetails: null,
  vendors: [],
  favoriteVendors: [],
  favoriteArticles: [],
  checklistItems: [],
  budgetItems: [],
  initialize: jest.fn(),
  setWeddingDetails: jest.fn(),
  updateProfileImage: jest.fn(),
  toggleFavoriteVendor: jest.fn(),
  loading: false,
};

jest.mock("../stores/wedding-store", () => ({
  useWeddingStore: Object.assign(
    jest.fn(() => ({ ...mockWeddingStoreState })),
    { getState: jest.fn(() => ({
      ...mockWeddingStoreState,
      checklistItems: [],
      budgetItems: [],
    })) }
  ),
}));

// Mock other dependencies
jest.mock("../services/imageUpload", () => ({
  pickAndUploadProfileImage: jest.fn(),
}));

describe("Favorites Navigation Integration", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });

    (useWeddingStore as unknown as jest.Mock).mockReturnValue({
      weddingDetails: {
        coupleName: "Test Couple",
        weddingDate: "2024-06-15",
        weddingLocation: "Test Location",
        totalBudget: 500000,
      },
      vendors: [
        {
          id: "1",
          name: "Test Vendor 1",
          category: "Photography",
          rating: 4.5,
          coverImage: "test-image.jpg",
          location: "Test City",
          priceRange: "₹50,000 - ₹1,00,000",
        },
        {
          id: "2",
          name: "Test Vendor 2",
          category: "Catering",
          rating: 4.8,
          coverImage: "test-image2.jpg",
          location: "Test City",
          priceRange: "₹1,00,000 - ₹2,00,000",
        },
      ],
      favoriteVendors: ["1", "2"],
      favoriteArticles: [],
      checklistItems: [{ id: "1", title: "Task", completed: true }],
      budgetItems: [{ id: "1", category: "Venue", estimated: 100000, spent: 50000, items: [] }],
      initialize: jest.fn(),
      setWeddingDetails: jest.fn(),
      updateProfileImage: jest.fn(),
      toggleFavoriteVendor: jest.fn(),
      loading: false,
    });
    // Also mock getState so useWeddingStore.getState() works in useMemo hooks
    (useWeddingStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
      checklistItems: [{ id: "1", title: "Task", completed: true }],
      vendors: [
        { id: "1", name: "Vendor 1", category: "Photography", rating: 4.5, coverImage: "", location: "City", priceRange: "" },
        { id: "2", name: "Vendor 2", category: "Catering", rating: 4.8, coverImage: "", location: "City", priceRange: "" },
      ],
      budgetItems: [{ id: "1", category: "Venue", estimated: 100000, spent: 50000, items: [] }],
    });
  });

  it("should navigate to favorites page when header is pressed", async () => {
    const { getByText } = render(<ProfileScreen />);

    const favoritesHeader = getByText("Favorite Vendors (2)");
    fireEvent.press(favoritesHeader);

    expect(mockPush).toHaveBeenCalledWith("/favorites");
  });

  it("should navigate to vendors page when no favorites exist", async () => {
    (useWeddingStore as unknown as jest.Mock).mockReturnValue({
      weddingDetails: {
        coupleName: "Test Couple",
        weddingDate: "2024-06-15",
        weddingLocation: "Test Location",
        totalBudget: 500000,
      },
      vendors: [],
      favoriteVendors: [],
      favoriteArticles: [],
      checklistItems: [],
      budgetItems: [],
      initialize: jest.fn(),
      setWeddingDetails: jest.fn(),
      updateProfileImage: jest.fn(),
      toggleFavoriteVendor: jest.fn(),
      loading: false,
    });

    const { getByText } = render(<ProfileScreen />);

    // The text renders as "Favorite Vendors " (with trailing space from {" "} + empty string)
    const favoritesHeader = getByText("Favorite Vendors");
    fireEvent.press(favoritesHeader);

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/vendors");
  });

  it("should show View All button when there are more than displayed favorites", async () => {
    // Mock getState to return proper data for the useMemo hooks
    (useWeddingStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
      checklistItems: [{ id: "1", title: "Task", completed: true }],
      vendors: Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test Vendor ${i + 1}`,
        category: i < 5 ? "Photography" : "Catering",
        rating: 4.5,
        coverImage: "test-image.jpg",
        location: "Test City",
        priceRange: "₹50,000 - ₹1,00,000",
      })),
      budgetItems: [{ id: "1", category: "Venue", estimated: 100000, spent: 50000, items: [] }],
    });
    // Mock more favorites to trigger View All button
    (useWeddingStore as unknown as jest.Mock).mockReturnValue({
      weddingDetails: {
        coupleName: "Test Couple",
        weddingDate: "2024-06-15",
        weddingLocation: "Test Location",
        totalBudget: 500000,
      },
      vendors: Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test Vendor ${i + 1}`,
        category: i < 5 ? "Photography" : "Catering",
        rating: 4.5,
        coverImage: "test-image.jpg",
        location: "Test City",
        priceRange: "₹50,000 - ₹1,00,000",
      })),
      favoriteVendors: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
      favoriteArticles: [],
      checklistItems: [{ id: "1", title: "Task", completed: true }],
      budgetItems: [{ id: "1", category: "Venue", estimated: 100000, spent: 50000, items: [] }],
      initialize: jest.fn(),
      setWeddingDetails: jest.fn(),
      updateProfileImage: jest.fn(),
      toggleFavoriteVendor: jest.fn(),
      loading: false,
    });

    const { getByText } = render(<ProfileScreen />);

    const viewAllButton = getByText("+5 more");
    expect(viewAllButton).toBeTruthy();

    fireEvent.press(viewAllButton);
    expect(mockPush).toHaveBeenCalledWith("/favorites");
  });

  it("should render profile even when loading", async () => {
    (useWeddingStore as unknown as jest.Mock).mockReturnValue({
      weddingDetails: null,
      vendors: [],
      favoriteVendors: [],
      favoriteArticles: [],
      checklistItems: [],
      budgetItems: [],
      initialize: jest.fn(),
      setWeddingDetails: jest.fn(),
      updateProfileImage: jest.fn(),
      toggleFavoriteVendor: jest.fn(),
      loading: true,
    });

    const { getByText } = render(<ProfileScreen />);

    // Profile always renders regardless of loading state
    expect(getByText("Your Wedding")).toBeTruthy();
  });
});
