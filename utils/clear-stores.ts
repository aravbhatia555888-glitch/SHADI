/**
 * Logout hygiene (H4 fix).
 *
 * auth-store.logout() used to clear only the auth user while six other
 * persisted Zustand stores kept the previous account's data in AsyncStorage
 * (bookings, subscription, chats, inquiries, vendor dashboard stats) — a
 * cross-account bleed on shared devices. Only wedding-store had a reset,
 * wired separately in app/_layout.tsx.
 *
 * This helper wipes BOTH the in-memory state and the persisted storage key
 * for every user-scoped store. Called from logout() after a successful
 * sign-out. NOTE: wedding-store personal data continues to be cleared by
 * _layout.tsx (resetPersonalData) — it is included here only for the
 * storage-key wipe so no stale blob survives on disk.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/config/supabase";
import { useAIChatStore } from "@/stores/ai-chat-store";
import { useBookingStore } from "@/stores/booking-store";
import { useChatStore } from "@/stores/chat-store";
import { useInquiryStore } from "@/stores/inquiry-store";
import { useReviewStore } from "@/stores/review-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useVendorDashboardStore } from "@/stores/vendor-dashboard-store";

const PERSISTED_KEYS = [
  "booking-storage",
  "subscription-storage",
  "chat-storage",
  "inquiry-storage",
  "vendor-dashboard-storage",
  "wedding-storage",
  "review-storage",
  "ai-chat-storage",
  "wedding-favorites",
  "shaadi-saved-cards-v1",
  "user_app_settings",
];

export async function clearAllPersistedStores(): Promise<void> {
  // Wipe persisted blobs first so a crash mid-reset cannot resurrect data.
  await Promise.all(PERSISTED_KEYS.map((key) => AsyncStorage.removeItem(key)));

  useBookingStore.setState({ bookings: [], loading: false, error: null });
  useSubscriptionStore.setState({
    subscription: null,
    loading: false,
    error: null,
  });
  useInquiryStore.setState({ inquiries: [], loading: false, error: null });
  useReviewStore.setState({ reviews: [], loading: false, error: null });
  useAIChatStore.setState({ messages: [], loading: false, error: null });
  useVendorDashboardStore.setState({
    stats: { total: 0, new: 0, replied: 0 },
    recentInquiries: [],
    loading: false,
    error: null,
  });

  // Tear down realtime channels before dropping message cache.
  const chat = useChatStore.getState();
  Object.values(chat._activeSubscriptions ?? {}).forEach((channel) => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // channel may already be removed
    }
  });
  useChatStore.setState({
    conversations: [],
    messages: {},
    loading: false,
    error: null,
    _activeSubscriptions: {},
  });
}
