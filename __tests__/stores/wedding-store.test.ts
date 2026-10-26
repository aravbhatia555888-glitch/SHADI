import { act, renderHook } from "@testing-library/react-native";
import { useWeddingStore } from "@/stores/wedding-store";

// --- DB-format mock data for supabase query results ---
const mockVendorDb = [
  {
    id: "v1",
    name: "Test Vendor",
    category: "Photography",
    description: "Test description",
    location: { city: "Mumbai" },
    rating: 4.5,
    review_count: 10,
    price_range: "₹10,000 - ₹50,000",
    min_price: 10000,
    max_price: 50000,
    cover_image: "https://example.com/img.jpg",
    photos: [],
    completed_bookings: 5,
    gallery: [],
    contact: { phone: "123", email: "v@test.com" },
    features: [],
    services: [],
    packages: [],
    availability: [],
    is_available: true,
    featured: false,
    verified: true,
    business_hours: undefined,
    user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

const mockChecklistDb = [
  {
    id: "c1",
    title: "Book venue",
    description: "Find and book venue",
    category: "Venue",
    due_date: "2026-12-15",
    completed: false,
    priority: "high",
  },
];

const mockBudgetDb = [
  {
    id: "b1",
    category: "Venue",
    estimated: 250000,
    spent: 0,
    budget_expenses: [],
  },
];

// Override supabase mock to return proper array data per table
jest.mock("@/config/supabase", () => {
  const createTableChain = (tableName: string) => {
    const tableData: Record<string, unknown[]> = {
      vendors: mockVendorDb,
      checklist_items: mockChecklistDb,
      budget_items: mockBudgetDb,
      favorite_vendors: [],
      favorite_articles: [],
      wedding_details: [],
    };
    const responseData = {
      data: tableData[tableName] ?? null,
      error: null,
    };
    const chain: Record<string, unknown> = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      range: jest.fn(),
      or: jest.fn(),
      limit: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
      single: jest.fn(() =>
        Promise.resolve({
          data: global.__mockSingleData,
          error: null,
        })
      ),
      maybeSingle: jest.fn(() =>
        Promise.resolve({
          data: global.__mockSingleData,
          error: null,
        })
      ),
      then: (resolve: (v: unknown) => void) => resolve(responseData),
    };
    // Wire up chain methods to return chain
    for (const key of ["select", "eq", "order", "range", "or", "limit"]) {
      (chain[key] as jest.Mock).mockReturnValue(chain);
    }
    (chain.insert as jest.Mock).mockReturnValue(chain);
    (chain.update as jest.Mock).mockReturnValue(chain);
    return chain;
  };

  return {
    supabase: {
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() =>
            Promise.resolve({ data: { path: "test-path" }, error: null })
          ),
          getPublicUrl: jest.fn(() => ({
            data: { publicUrl: "https://test-url.com/image.jpg" },
          })),
          remove: jest.fn(() => Promise.resolve({ error: null })),
        })),
      },
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: { user: { id: "test-user-id" } },
            error: null,
          })
        ),
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: null }, error: null })
        ),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(() => Promise.resolve()),
      })),
      removeChannel: jest.fn(),
      from: jest.fn((tableName: string) => createTableChain(tableName)),
    },
    handleSupabaseError: jest.fn((error: unknown) => (error as Error)?.message || "Unknown error"),
  };
});

jest.mock("@/config/testing", () => ({
  TESTING_MODE: true,
  MOCK_USER: {
    id: "demo-user-123",
    email: "demo@shaadibazaar.com",
    name: "Demo User",
  },
  testingLog: jest.fn(),
  simulateAsync: jest.fn((result: unknown) => Promise.resolve(result)),
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const mockImpl = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  };
  return {
    __esModule: true,
    default: mockImpl,
  };
});

declare global {
  var __mockSingleData: Record<string, unknown> | null;
}

describe("Wedding Store", () => {
  beforeEach(() => {
    // Reset the dynamic single data so other tests are not affected
    global.__mockSingleData = null;
    const { result } = renderHook(() => useWeddingStore());
    act(() => {
      result.current.clearError();
    });
  });

  describe("Profile Management", () => {
    it("should update profile image", async () => {
      const { result } = renderHook(() => useWeddingStore());

      // Set wedding details first so the store has something to update
      await act(async () => {
        await result.current.setWeddingDetails({
          coupleName: "Test Couple",
          weddingDate: "2026-06-15T00:00:00.000Z",
          weddingLocation: "Grand Hotel",
          totalBudget: 500000,
        });
      });

      await act(async () => {
        await result.current.updateProfileImage("file://test-image.jpg");
      });

      expect(result.current.weddingDetails?.profileImageUrl).toBe(
        "file://test-image.jpg"
      );
    });

    it("should set wedding details", async () => {
      const { result } = renderHook(() => useWeddingStore());

      const newDetails = {
        coupleName: "Jane & John",
        weddingDate: "2026-06-15T00:00:00.000Z",
        weddingLocation: "Grand Hotel",
        totalBudget: 500000,
      };

      await act(async () => {
        await result.current.setWeddingDetails(newDetails);
      });

      expect(result.current.weddingDetails?.coupleName).toBe("Jane & John");
      expect(result.current.weddingDetails?.weddingDate).toBe(
        "2026-06-15T00:00:00.000Z"
      );
      expect(result.current.weddingDetails?.weddingLocation).toBe(
        "Grand Hotel"
      );
      expect(result.current.weddingDetails?.totalBudget).toBe(500000);
    });
  });

  describe("Vendor Management", () => {
    it("should load vendors", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadVendors();
      });

      expect(result.current.vendors.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });

    it("should toggle vendor favorite", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadVendors();
      });

      const firstVendor = result.current.vendors[0];
      const initialFavoriteState = result.current.favoriteVendors.includes(
        firstVendor.id
      );

      await act(async () => {
        await result.current.toggleFavoriteVendor(firstVendor.id);
      });

      const newFavoriteState = result.current.favoriteVendors.includes(
        firstVendor.id
      );
      expect(newFavoriteState).toBe(!initialFavoriteState);
    });
  });

  describe("Checklist Management", () => {
    it("should load checklist items", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadChecklistItems("test-user-id");
      });

      expect(result.current.checklistItems.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });

    it("should toggle checklist item completion", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadChecklistItems("test-user-id");
      });

      const firstItem = result.current.checklistItems[0];
      const initialCompletedState = firstItem.completed;

      await act(async () => {
        await result.current.updateChecklistItem(
          firstItem.id,
          !initialCompletedState
        );
      });

      const updatedItem = result.current.checklistItems.find(
        (item) => item.id === firstItem.id
      );
      expect(updatedItem?.completed).toBe(!initialCompletedState);
    });

    it("should add new checklist item", async () => {
      // Set the dynamic single data so insert().select().single() returns this data
      global.__mockSingleData = {
        id: "new-checklist-1",
        title: "Test Task",
        description: "Test Description",
        category: "Planning",
        due_date: "2026-06-01",
        completed: false,
        priority: "medium",
      };

      const { result } = renderHook(() => useWeddingStore());

      const newItem = {
        title: "Test Task",
        description: "Test Description",
        category: "Planning",
        dueDate: "2026-06-01",
        priority: "medium" as const,
        completed: false,
      };

      await act(async () => {
        await result.current.addChecklistItem(newItem);
      });

      const addedItem = result.current.checklistItems.find(
        (item) => item.title === "Test Task"
      );
      expect(addedItem).toBeDefined();
      expect(addedItem?.description).toBe("Test Description");
    });
  });

  describe("Budget Management", () => {
    it("should load budget items", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadBudgetItems("test-user-id");
      });

      expect(result.current.budgetItems.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });

    it("should add expense to budget item", async () => {
      const { result } = renderHook(() => useWeddingStore());

      await act(async () => {
        await result.current.loadBudgetItems("test-user-id");
      });

      const firstBudgetItem = result.current.budgetItems[0];
      const initialItemCount = firstBudgetItem.items.length;

      const newExpense = {
        name: "Test Expense",
        amount: 500,
        date: "2026-05-01T00:00:00.000Z",
        paid: false,
        vendor: "Test Vendor",
      };

      // Set the dynamic single data so insert().select().single() returns this data
      global.__mockSingleData = {
        id: "new-expense-1",
        name: "Test Expense",
        amount: 500,
        date: "2026-05-01T00:00:00.000Z",
        paid: false,
        vendor: "Test Vendor",
        notes: null,
      };

      await act(async () => {
        await result.current.addBudgetExpense(firstBudgetItem.id, newExpense);
      });

      const updatedBudgetItem = result.current.budgetItems.find(
        (item) => item.id === firstBudgetItem.id
      );
      expect(updatedBudgetItem?.items.length).toBe(initialItemCount + 1);

      const addedExpense = updatedBudgetItem?.items.find(
        (exp) => exp.name === "Test Expense"
      );
      expect(addedExpense).toBeDefined();
      expect(addedExpense?.amount).toBe(500);
    });
  });

  describe("Error Handling", () => {
    it("should handle loading state correctly", async () => {
      const { result } = renderHook(() => useWeddingStore());

      expect(result.current.loading).toBe(false);

      const loadingPromise = act(async () => {
        await result.current.loadVendors();
      });

      await loadingPromise;

      expect(result.current.loading).toBe(false);
    });
  });

  describe("Account isolation", () => {
    it("clears persisted personal data when the active account signs out", () => {
      useWeddingStore.setState({
        weddingDetails: {
          coupleName: "Previous User",
          weddingDate: "2026-06-15T00:00:00.000Z",
          weddingLocation: "Mumbai",
          totalBudget: 500000,
        },
        favoriteVendors: ["v1"],
        favoriteArticles: ["article-1"],
        checklistItems: mockChecklistDb.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          dueDate: item.due_date,
          completed: item.completed,
          priority: item.priority as "high",
        })),
        budgetItems: [],
        isInitialized: true,
      });

      act(() => {
        useWeddingStore.getState().resetPersonalData();
      });

      const state = useWeddingStore.getState();
      expect(state.weddingDetails).toBeNull();
      expect(state.favoriteVendors).toEqual([]);
      expect(state.favoriteArticles).toEqual([]);
      expect(state.checklistItems).toEqual([]);
      expect(state.budgetItems).toEqual([]);
      expect(state.isInitialized).toBe(false);
    });
  });
});
