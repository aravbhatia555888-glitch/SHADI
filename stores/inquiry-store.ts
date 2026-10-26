import { handleSupabaseError,supabase } from "@/config/supabase";
import type { VendorInquiry } from "@/schemas/wedding";
import { VendorInquirySchema } from "@/schemas/wedding";
import { isValidResult,validate } from "@/utils/api-validator";
import { withRetry } from "@/utils/retry";
import { transformInquiryFromDb } from "@/utils/transforms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface InquiryState {
  inquiries: VendorInquiry[];
  loading: boolean;
  error: string | null;

  loadUserInquiries: (userId: string) => Promise<void>;
  sendInquiry: (
    inquiry: Omit<VendorInquiry, "id" | "userId" | "status" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; inquiryId?: string; error?: string }>;
  updateInquiryStatus: (
    inquiryId: string,
    status: VendorInquiry["status"]
  ) => Promise<{ success: boolean; error?: string }>;
  replyToInquiry: (
    inquiryId: string,
    response: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteInquiry: (
    inquiryId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useInquiryStore = create<InquiryState>()(
  persist(
    (set, _get) => ({
  inquiries: [],
  loading: false,
  error: null,

  loadUserInquiries: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: inquiryData, error } = await withRetry(() =>
        supabase
          .from("vendor_inquiries")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        if (__DEV__) console.warn("Failed to load user inquiries:", error);
        set({ error: errorMessage, loading: false });
        return;
      }

      if (inquiryData) {
        const inquiries: VendorInquiry[] = inquiryData
          .map((i) => transformInquiryFromDb(i as Record<string, unknown>))
          .map((i) => validate(VendorInquirySchema, i))
          .filter(isValidResult)
          .map((r) => r.data);

        set({ inquiries, loading: false });
      } else {
        set({ inquiries: [], loading: false });
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      if (__DEV__) console.warn("Error loading user inquiries:", error);
      set({ error: errorMessage, loading: false });
    }
  },

  sendInquiry: async (inquiry) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await withRetry(() =>
        supabase
          .from("vendor_inquiries")
          .insert({
            vendor_id: inquiry.vendorId,
            user_id: user.id,
            user_name: inquiry.userName,
            user_email: inquiry.userEmail,
            user_phone: inquiry.userPhone,
            subject: inquiry.subject,
            message: inquiry.message,
            event_date: inquiry.eventDate,
            event_type: inquiry.eventType,
            budget: inquiry.budget,
            status: "new",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      if (data) {
        set({ loading: false });
        return { success: true, inquiryId: data.id as string };
      }

      set({ loading: false });
      return { success: false, error: "Failed to send inquiry" };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateInquiryStatus: async (inquiryId: string, status) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { error } = await withRetry(() =>
        supabase
          .from("vendor_inquiries")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inquiryId)
          .eq("user_id", user.id)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      set((state) => ({
        inquiries: state.inquiries.map((i) =>
          i.id === inquiryId ? { ...i, status } : i
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  replyToInquiry: async (inquiryId: string, response: string) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      // ── Atomic reply (H6 / CRIT-04 fix) ───────────────────────────
      // The SECURITY DEFINER RPC below validates vendor/inquiry ownership,
      // handles free/paid credit allowance, and updates the reply atomically.
      // Do not perform a client-side SELECT on vendor_inquiries here because
      // vendors lack direct SELECT RLS to protect customer contact PII.
      const { data: replyResult, error } = await supabase.rpc(
        "reply_to_inquiry",
        {
          p_inquiry_id: inquiryId,
          p_response: response,
        }
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      if (replyResult && replyResult.success === false) {
        const errorMessage =
          replyResult.error || "Failed to send reply";
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      set((state) => ({
        inquiries: state.inquiries.map((i) =>
          i.id === inquiryId
            ? {
                ...i,
                vendorResponse: response,
                responseDate: new Date().toISOString(),
                status: "replied" as const,
              }
            : i
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteInquiry: async (inquiryId: string) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { error } = await withRetry(() =>
        supabase
          .from("vendor_inquiries")
          .delete()
          .eq("id", inquiryId)
          .eq("user_id", user.id)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      set((state) => ({
        inquiries: state.inquiries.filter((i) => i.id !== inquiryId),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => {
    set({ error: null });
  },
    }),
    {
      name: "inquiry-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        inquiries: state.inquiries,
      }),
    }
  )
);
