import { handleSupabaseError,supabase } from "@/config/supabase";
import type { ChatConversation,ChatMessage } from "@/schemas/wedding";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { withRetry } from "@/utils/retry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface ChatState {
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  loading: boolean;
  error: string | null;

  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    senderId: string,
    senderType?: "user" | "vendor"
  ) => Promise<{ success: boolean; error?: string }>;
  startConversation: (
    userId: string,
    vendorId: string
  ) => Promise<{ success: boolean; conversationId?: string; error?: string }>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (
    conversationId: string
  ) => Promise<{ success: boolean; error?: string }>;
  subscribeToMessages: (conversationId: string) => () => void;
  clearError: () => void;
  _activeSubscriptions: Record<string, ReturnType<typeof supabase.channel>>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      loading: false,
      error: null,
      _activeSubscriptions: {},

      loadConversations: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await withRetry(() =>
            supabase
              .from("chat_conversations")
              .select(
                `
                *,
                vendor:vendors(name, cover_image, category)
              `
              )
              .eq("user_id", userId)
              .order("last_message_at", { ascending: false })
          );

          if (error) {
            if (__DEV__) console.warn("Failed to load conversations:", error);
            set({ loading: false });
            return;
          }

          if (data) {
            const conversations: ChatConversation[] = data.map(
              (c: Record<string, unknown>) => {
                const vendor = c.vendor as Record<string, unknown> | null;
                return {
                  id: c.id as string,
                  userId: c.user_id as string,
                  vendorId: c.vendor_id as string,
                  vendorName: vendor?.name as string | undefined,
                  vendorImage: vendor?.cover_image as string | undefined,
                  vendorCategory: vendor?.category as string | undefined,
                  lastMessage: c.last_message as string | undefined,
                  lastMessageAt: c.last_message_at as string | undefined,
                  unreadCount: (c.unread_count as number) ?? 0,
                  createdAt: c.created_at as string,
                  updatedAt: c.updated_at as string,
                };
              }
            );
            set({ conversations, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          set({ error: handleSupabaseError(error), loading: false });
        }
      },

      loadMessages: async (conversationId: string) => {
        try {
          const { data, error } = await withRetry(() =>
            supabase
              .from("chat_messages")
              .select("*")
              .eq("conversation_id", conversationId)
              .order("created_at", { ascending: true })
          );

          if (error) {
            if (__DEV__) console.warn("Failed to load messages:", error);
            return;
          }

          if (data) {
            const messages: ChatMessage[] = data.map(
              (m: Record<string, unknown>) => ({
                id: m.id as string,
                conversationId: m.conversation_id as string,
                senderId: m.sender_id as string,
                senderType: m.sender_type as "user" | "vendor",
                content: m.content as string,
                messageType: ((m.message_type as string) || "text") as
                  | "text"
                  | "image"
                  | "file",
                read: (m.read as boolean) ?? false,
                createdAt: m.created_at as string,
              })
            );
            set((state) => ({
              messages: { ...state.messages, [conversationId]: messages },
            }));
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading messages:", error);
        }
      },

      sendMessage: async (
        conversationId: string,
        content: string,
        senderId: string,
        senderType: "user" | "vendor" = "user"
      ) => {
        try {
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const optimisticMessage: ChatMessage = {
            id: tempId,
            conversationId,
            senderId,
            senderType,
            content,
            messageType: "text",
            read: true,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [
                ...(state.messages[conversationId] || []),
                optimisticMessage,
              ],
            },
          }));

          const { error } = await withRetry(() => supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            sender_id: senderId,
            // M3/L10 fix: sender_type is pinned per caller side — the RLS
            // policies now REQUIRE 'vendor' from vendor owners and 'user'
            // from customers, so spoofing the other side is impossible.
            sender_type: senderType,
            content,
            message_type: "text",
          }));

          if (error) {
            set((state) => ({
              messages: {
                ...state.messages,
                [conversationId]: (state.messages[conversationId] || []).filter(
                  (m) => m.id !== tempId
                ),
              },
            }));
            return { success: false, error: handleSupabaseError(error) };
          }

          // Keep the optimistic temp message — the realtime INSERT event for
          // this send is de-duplicated in subscribeToMessages, so the sender
          // sees exactly one copy (the temp one) instead of a duplicate.
          trackEvent(AnalyticsEvents.VENDOR_CONTACT, { conversationId });
          return { success: true };
        } catch (error) {
          return { success: false, error: handleSupabaseError(error) };
        }
      },

      startConversation: async (userId: string, vendorId: string) => {
        try {
          const existing = get().conversations.find(
            (c) => c.vendorId === vendorId
          );
          if (existing) {
            return { success: true, conversationId: existing.id };
          }

          const { data, error } = await withRetry(() =>
            supabase
              .from("chat_conversations")
              .insert({ user_id: userId, vendor_id: vendorId })
              .select("id")
              .single()
          );

          if (error) {
            return { success: false, error: handleSupabaseError(error) };
          }

          return { success: true, conversationId: data.id };
        } catch (error) {
          return { success: false, error: handleSupabaseError(error) };
        }
      },

      markAsRead: async (conversationId: string) => {
        try {
          await supabase
            .from("chat_messages")
            .update({ read: true })
            .eq("conversation_id", conversationId)
            .eq("read", false);

          await supabase
            .from("chat_conversations")
            .update({ unread_count: 0 })
            .eq("id", conversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
          }));
        } catch (error) {
          if (__DEV__) console.warn("Error marking as read:", error);
        }
      },

      deleteConversation: async (conversationId: string) => {
        try {
          // The DB foreign key ON DELETE CASCADE automatically removes child
          // chat_messages when chat_conversations is deleted. Deleting chat_messages
          // directly is blocked by RLS to enforce message immutability.
          const { error } = await withRetry(() =>
            supabase
              .from("chat_conversations")
              .delete()
              .eq("id", conversationId)
          );

          if (error) {
            return { success: false, error: handleSupabaseError(error) };
          }

          set((state) => {
            const { [conversationId]: _, ...remainingMessages } = state.messages;
            return {
              conversations: state.conversations.filter(
                (c) => c.id !== conversationId
              ),
              messages: remainingMessages,
            };
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: handleSupabaseError(error) };
        }
      },

      subscribeToMessages: (conversationId: string) => {
        const active = get()._activeSubscriptions;
        if (active[conversationId]) {
          return () => {};
        }

        const channel = supabase
          .channel(`chat_messages_${conversationId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const newMessage = payload.new as Record<string, unknown>;
              const message: ChatMessage = {
                id: newMessage.id as string,
                conversationId: newMessage.conversation_id as string,
                senderId: newMessage.sender_id as string,
                senderType: newMessage.sender_type as "user" | "vendor",
                content: newMessage.content as string,
                messageType: ((newMessage.message_type as string) || "text") as
                  | "text"
                  | "image"
                  | "file",
                read: (newMessage.read as boolean) ?? false,
                createdAt: newMessage.created_at as string,
              };
              set((state) => {
                const existing = state.messages[conversationId] || [];
                // De-duplicate: the sender's own message is already shown
                // optimistically (temp id), so skip the realtime echo that
                // carries the same sender + content within a few seconds.
                const isEchoOfOwnMessage = existing.some(
                  (m) =>
                    m.senderId === message.senderId &&
                    m.content === message.content &&
                    Math.abs(
                      new Date(m.createdAt).getTime() -
                        new Date(message.createdAt).getTime()
                    ) < 5000
                );
                if (isEchoOfOwnMessage) return {};
                return {
                  messages: {
                    ...state.messages,
                    [conversationId]: [...existing, message],
                  },
                };
              });
            }
          )
          .subscribe();

        set((state) => ({
          _activeSubscriptions: {
            ...state._activeSubscriptions,
            [conversationId]: channel,
          },
        }));

        return () => {
          supabase.removeChannel(channel);
          set((state) => {
            const { [conversationId]: _, ...rest } = state._activeSubscriptions;
            return { _activeSubscriptions: rest };
          });
        };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);
