import { handleSupabaseError,supabase } from "@/config/supabase";
import type { VendorReview } from "@/schemas/wedding";
import { VendorReviewSchema } from "@/schemas/wedding";
import { isValidResult,validate } from "@/utils/api-validator";
import { withRetry } from "@/utils/retry";
import { transformReviewFromDb } from "@/utils/transforms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface ReviewState {
  reviews: VendorReview[];
  loading: boolean;
  error: string | null;

  loadVendorReviews: (vendorId: string) => Promise<void>;
  addVendorReview: (
    review: Omit<VendorReview, "id" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; error?: string }>;
  updateVendorReview: (
    reviewId: string,
    updates: Partial<VendorReview>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVendorReview: (
    reviewId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearReviews: () => void;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
  reviews: [],
  loading: false,
  error: null,

  loadVendorReviews: async (vendorId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: reviewData, error } = await withRetry(() =>
        supabase
          .from("vendor_reviews")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(50)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        if (__DEV__) console.warn("Failed to load vendor reviews:", error);
        set({ error: errorMessage, loading: false });
        return;
      }

      if (reviewData) {
        const reviews: VendorReview[] = reviewData
          .map((r) => transformReviewFromDb(r as Record<string, unknown>))
          .map((r) => validate(VendorReviewSchema, r))
          .filter(isValidResult)
          .map((r) => r.data);

        set({ reviews, loading: false });
      } else {
        set({ reviews: [], loading: false });
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      if (__DEV__) console.warn("Error loading vendor reviews:", error);
      set({ error: errorMessage, loading: false });
    }
  },

  addVendorReview: async (review) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { error } = await withRetry(() => supabase.from("vendor_reviews").insert({
        vendor_id: review.vendorId,
        user_id: user.id,
        user_name: review.userName,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      // Add the new review to local state immediately
      set((state) => ({
        reviews: [
          {
            id: `temp-${Date.now()}`,
            vendorId: review.vendorId,
            userId: user.id,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            photos: review.photos || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...state.reviews,
        ],
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateVendorReview: async (reviewId: string, updates) => {
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
          .from("vendor_reviews")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reviewId)
          .eq("user_id", user.id)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      // Update the review in local state immediately
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
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

  deleteVendorReview: async (reviewId: string) => {
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
          .from("vendor_reviews")
          .delete()
          .eq("id", reviewId)
          .eq("user_id", user.id)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== reviewId),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearReviews: () => {
    set({ reviews: [], error: null });
  },

  clearError: () => {
    set({ error: null });
  },
    }),
    {
      name: "review-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        reviews: state.reviews,
      }),
    }
  )
);
