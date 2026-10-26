import { useChatStore } from "@/stores/chat-store";

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: "test-user" } }, error: null })
      ),
    },
  },
  handleSupabaseError: jest.fn((error: any) => error?.message || "Unknown error"),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("@/services/analytics", () => ({
  trackEvent: jest.fn(),
  AnalyticsEvents: {},
}));

describe("Chat Store", () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      messages: {},
      loading: false,
      error: null,
    } as any);
  });

  it("has correct initial shape", () => {
    const state = useChatStore.getState();
    expect(state).toHaveProperty("conversations");
    expect(state).toHaveProperty("messages");
    expect(state).toHaveProperty("loading");
    expect(state).toHaveProperty("error");
    expect(state).toHaveProperty("loadConversations");
    expect(state).toHaveProperty("loadMessages");
    expect(state).toHaveProperty("sendMessage");
    expect(state).toHaveProperty("startConversation");
    expect(state).toHaveProperty("markAsRead");
    expect(state).toHaveProperty("clearError");
  });

  it("starts with empty conversations and messages", () => {
    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual({});
  });

  it("starts with loading false and error null", () => {
    const state = useChatStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("clears error", () => {
    useChatStore.setState({ error: "Some error" });
    useChatStore.getState().clearError();
    expect(useChatStore.getState().error).toBeNull();
  });

  it("sets loading state", () => {
    useChatStore.setState({ loading: true });
    expect(useChatStore.getState().loading).toBe(true);
  });

  it("sets error state", () => {
    useChatStore.setState({ error: "Chat error" });
    expect(useChatStore.getState().error).toBe("Chat error");
  });
});
