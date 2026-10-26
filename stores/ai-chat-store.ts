import { sendMessageToAI,type ChatMessage } from "@/services/ai-planner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { useWeddingStore } from "./wedding-store";

const MAX_AI_MESSAGES = 100;

let _messageIdCounter = 0;

interface AIChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;

  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  loadChatHistory: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Namaste! I am your AI Wedding Planner. I can help you with vendor recommendations, budget planning, timeline creation, cultural ceremony advice, and more. How can I assist with your special day?",
          timestamp: new Date().toISOString(),
        },
      ],
      loading: false,
      error: null,

      sendMessage: async (content: string) => {
        _messageIdCounter++;
        const userMessage: ChatMessage = {
          id: `${Date.now()}-${_messageIdCounter}`,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          loading: true,
          error: null,
        }));

        try {
          // Truncate oldest messages if exceeding limit, keeping the welcome message
          set((state) => {
            if (state.messages.length > MAX_AI_MESSAGES) {
              const keep = state.messages.filter((m) => m.id === "welcome");
              const rest = state.messages
                .filter((m) => m.id !== "welcome")
                .slice(-(MAX_AI_MESSAGES - 1));
              return { messages: [...keep, ...rest] };
            }
            return {};
          });

          const _user = useAuthStore.getState().user;
          const weddingDetails = useWeddingStore.getState().weddingDetails;

          const context = {
            weddingDate: weddingDetails?.weddingDate,
            budget: weddingDetails?.totalBudget,
            location: weddingDetails?.weddingLocation,
            culture: (weddingDetails as Record<string, unknown> | undefined)?.culture as string || "Indian",
            guests: undefined,
          };

          const history = get().messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const response = await sendMessageToAI(history, context);

          _messageIdCounter++;
          const assistantMessage: ChatMessage = {
            id: `${Date.now()}-${_messageIdCounter}`,
            role: "assistant",
            content: response,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            loading: false,
          }));
        } catch (_error) {
          set({
            error: "Failed to get response. Please try again.",
            loading: false,
          });
        }
      },

      clearChat: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content:
                "Namaste! I am your AI Wedding Planner. I can help you with vendor recommendations, budget planning, timeline creation, cultural ceremony advice, and more. How can I assist with your special day?",
              timestamp: new Date().toISOString(),
            },
          ],
          error: null,
        }),

      loadChatHistory: () => {
        // Handled by zustand persist
      },
    }),
    {
      name: "ai-chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
