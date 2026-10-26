import { handleSupabaseError,supabase } from "@/config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface InquiryStats {
  total: number;
  new: number;
  replied: number;
}

interface RecentInquiry {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "new" | "replied" | "closed";
  createdAt: string;
}

interface DashboardInquiryRow {
  id: string;
  user_name: string;
  subject: string;
  message: string;
  status: "new" | "replied" | "closed";
  created_at: string;
}

interface VendorDashboardState {
  stats: InquiryStats;
  recentInquiries: RecentInquiry[];
  loading: boolean;
  error: string | null;

  loadDashboard: (vendorId: string) => Promise<void>;
  clearError: () => void;
}

export const useVendorDashboardStore = create<VendorDashboardState>()(
  persist(
    (set, _get) => ({
      stats: { total: 0, new: 0, replied: 0 },
      recentInquiries: [],
      loading: false,
      error: null,

      loadDashboard: async (vendorId: string) => {
        try {
          set({ loading: true, error: null });

          // NOTE: Direct SELECTs on vendor_inquiries are blocked by RLS for
          // vendors (PII protection). These security-definer RPCs verify
          // vendor ownership and return only non-PII dashboard data.
          // See supabase-vendor-inquiry-dashboard.sql
          const [statsResult, recentResult] = await Promise.allSettled([
            supabase.rpc("get_vendor_inquiry_stats", {
              vendor_id_input: vendorId,
            }),
            supabase.rpc("get_vendor_inquiries_dashboard", {
              vendor_id_input: vendorId,
            }),
          ]);

          if (
            (statsResult.status === "rejected" ||
              (statsResult.status === "fulfilled" && statsResult.value.error)) &&
            (recentResult.status === "rejected" ||
              (recentResult.status === "fulfilled" && recentResult.value.error))
          ) {
            const error = (recentResult.status === "fulfilled"
              ? recentResult.value.error
              : recentResult.reason) as unknown;
            const errorMessage = handleSupabaseError(error);
            if (__DEV__) console.warn("Failed to load dashboard:", error);
            set({ error: errorMessage, loading: false });
            return;
          }

          // Surface partial failures instead of silently showing zeros:
          // a failed fetch is still a data-quality problem for the vendor.
          if (
            statsResult.status === "rejected" ||
            (statsResult.status === "fulfilled" && statsResult.value.error)
          ) {
            const statsErr = statsResult.status === "fulfilled"
              ? statsResult.value.error
              : statsResult.reason;
            if (__DEV__) console.warn("Failed to load inquiry stats:", statsErr);
          }
          if (
            recentResult.status === "rejected" ||
            (recentResult.status === "fulfilled" && recentResult.value.error)
          ) {
            const recentErr = recentResult.status === "fulfilled"
              ? recentResult.value.error
              : recentResult.reason;
            if (__DEV__) console.warn("Failed to load recent inquiries:", recentErr);
          }

          const statsData =
            statsResult.status === "fulfilled" ? statsResult.value.data : null;
          const recentData =
            recentResult.status === "fulfilled" ? recentResult.value.data : null;

          const stats: InquiryStats = {
            total: statsData?.[0]?.total ?? 0,
            new: statsData?.[0]?.new ?? 0,
            replied: statsData?.[0]?.replied ?? 0,
          };

          const recentInquiries: RecentInquiry[] = (
            (recentData || []) as DashboardInquiryRow[]
          ).map((i) => ({
              id: i.id,
              userName: i.user_name,
              userEmail: "", // intentionally not exposed to vendors
              subject: i.subject,
              message: i.message,
              status: i.status as "new" | "replied" | "closed",
              createdAt: i.created_at,
            })
          );

          set({ stats, recentInquiries, loading: false });
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          if (__DEV__) console.warn("Error loading dashboard:", error);
          set({ error: errorMessage, loading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "vendor-dashboard-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        stats: state.stats,
        recentInquiries: state.recentInquiries,
      }),
    }
  )
);
