import { useAuthStore } from "@/stores/auth-store";

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signUp: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      updateUser: jest.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
  handleSupabaseError: jest.fn(
    (error: any) => error?.message || "Unknown error"
  ),
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const mockImpl = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  };
  return {
    __esModule: true,
    default: mockImpl,
  };
});

jest.mock("@/services/analytics", () => ({
  trackEvent: jest.fn(),
  AnalyticsEvents: {
    SIGN_IN: "sign_in",
    SIGN_UP: "sign_up",
    SIGN_OUT: "sign_out",
    PASSWORD_RESET: "password_reset",
  },
}));

jest.mock("@/utils/transforms", () => ({
  transformProfileToUser: jest.fn((profile: any) => ({
    id: profile.id || "test-id",
    email: profile.email || "test@test.com",
    name: profile.name || "Test User",
  })),
}));

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      loading: true,
      error: null,
      isInitialized: false,
    });
  });

  it("has correct initial shape", () => {
    const state = useAuthStore.getState();
    expect(state).toHaveProperty("user");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("isInitialized");
    expect(state).toHaveProperty("initialize");
    expect(state).toHaveProperty("signIn");
    expect(state).toHaveProperty("signUp");
    expect(state).toHaveProperty("logout");
    expect(state).toHaveProperty("clearError");
  });

  it("starts with null user after reset", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });

  it("starts with not initialized after reset", () => {
    const state = useAuthStore.getState();
    expect(state.isInitialized).toBe(false);
  });

  it("clears error", () => {
    useAuthStore.setState({ error: "Some error" });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("sets loading state", () => {
    useAuthStore.setState({ loading: true });
    expect(useAuthStore.getState().loading).toBe(true);
    useAuthStore.setState({ loading: false });
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("sets error state", () => {
    useAuthStore.setState({ error: "Test error message" });
    expect(useAuthStore.getState().error).toBe("Test error message");
  });

  it("sets user state", () => {
    const mockUser = {
      id: "test-uuid-1234",
      email: "test@example.com",
      name: "Test User",
    };
    useAuthStore.setState({ user: mockUser });
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("clears user on logout", async () => {
    useAuthStore.setState({
      user: { id: "test-id", email: "test@test.com", name: "Test" },
    });
    expect(useAuthStore.getState().user).not.toBeNull();

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("sets isInitialized state", () => {
    useAuthStore.setState({ isInitialized: true });
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it("returns error when updateProfile called with no user", async () => {
    useAuthStore.setState({ user: null });
    const result = await useAuthStore
      .getState()
      .updateProfile({ name: "New Name" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("No user logged in");
  });

  it("returns error when changePassword called with no user", async () => {
    useAuthStore.setState({ user: null });
    const result = await useAuthStore.getState().changePassword("old", "new");
    expect(result.success).toBe(false);
    expect(result.error).toBe("No user logged in");
  });

  it("returns error when deleteAccount called with no user", async () => {
    useAuthStore.setState({ user: null });
    const result = await useAuthStore.getState().deleteAccount();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No user logged in");
  });
});
