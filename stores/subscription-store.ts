import { handleSupabaseError,supabase } from "@/config/supabase";
import { trackEvent } from "@/services/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────

export type SubscriptionPlan = "free" | "basic" | "premium" | "elite";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trialing";

export interface VendorSubscription {
  id: string;
  vendorId: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  interval: "month" | "year";
  razorpaySubscriptionId?: string;
  featuredUntil?: string;
  verifiedUntil?: string;
  leadCredits: number;
  inquiryCredits: number;
  inquiryResponsesUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number; // ₹/month
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "List your services on ShaadiBazaar",
    features: [
      "Basic vendor listing",
      "Visible in search results",
      "5 inquiry responses per month",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 500,
    description: "Get verified and stand out",
    features: [
      "Verified badge on your profile",
      "20 inquiry responses per month",
      "Email notifications for new inquiries",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 2000,
    description: "Featured placement & more",
    features: [
      "All Basic features",
      "Featured placement in search results",
      "100 inquiry responses per month",
      "Analytics dashboard",
      "Appears in 'Top Vendors' section",
    ],
    isPopular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 5000,
    description: "Maximum visibility & reach",
    features: [
      "All Premium features",
      "Top of your category",
      "Unlimited inquiry responses",
      "Dedicated account manager",
      "Custom profile page design",
      "Featured in marketing campaigns",
    ],
  },
];

interface SubscriptionState {
  subscription: VendorSubscription | null;
  loading: boolean;
  error: string | null;

  loadSubscription: (vendorId: string) => Promise<void>;
  refreshSubscription: (vendorId: string) => Promise<void>;
  createSubscription: (params: {
    vendorId: string;
    plan: SubscriptionPlan;
    interval?: "month" | "year";
  }) => Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  getPlanInfo: () => SubscriptionPlanInfo;
  hasFeature: (feature: string) => boolean;
  getRemainingLeadCredits: () => number;
  isFeatured: () => boolean;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      loading: false,
      error: null,

      loadSubscription: async (vendorId: string) => {
        try {
          set({ loading: true, error: null });

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ loading: false });
            return;
          }

          // Get active subscription for this vendor
          const { data, error } = await supabase
            .from("vendor_subscriptions")
            .select("*")
            .eq("vendor_id", vendorId)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("current_period_end", { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows — user is on free plan
            if (__DEV__)
              console.warn("Failed to load subscription:", error);
            set({ loading: false });
            return;
          }

          if (data) {
            // Check if the subscription has expired
            const now = new Date();
            const periodEnd = new Date(data.current_period_end);
            let status = data.status;

            if (status === "active" && periodEnd < now) {
              status = "expired";
            }

            const subscription: VendorSubscription = {
              id: data.id,
              vendorId: data.vendor_id,
              userId: data.user_id,
              plan: data.plan,
              status: status as SubscriptionStatus,
              amount: data.amount,
              currency: data.currency,
              interval: data.interval,
              razorpaySubscriptionId: data.razorpay_subscription_id,
              featuredUntil: data.featured_until,
              verifiedUntil: data.verified_until,
              leadCredits: data.lead_credits,
              inquiryCredits: data.inquiry_credits,
              inquiryResponsesUsed: data.inquiry_responses_used ?? 0,
              currentPeriodStart: data.current_period_start,
              currentPeriodEnd: data.current_period_end,
              cancelledAt: data.cancelled_at,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            set({ subscription, loading: false });
          } else {
            // No active subscription — user is on free plan
            set({ subscription: null, loading: false });
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading subscription:", error);
          set({ error: handleSupabaseError(error), loading: false });
        }
      },

      refreshSubscription: async (vendorId: string) => {
        await get().loadSubscription(vendorId);
      },

      createSubscription: async ({ vendorId, plan, interval = "month" }) => {
        try {
          set({ loading: true, error: null });

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ loading: false });
            return { success: false, error: "User not authenticated" };
          }

          const planInfo = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
          if (!planInfo) {
            set({ loading: false });
            return { success: false, error: "Invalid plan" };
          }

          if (plan === "free") {
            // S7 fix: Free plan activation is now server-side only.
            // The client cannot self-service a tier change. Call the
            // create-subscription Edge Function which handles this server-side.
            set({ loading: false });
            return { success: false, error: "Free plan activation is handled automatically. Contact support if needed." };
          }

          // Paid plan — create Razorpay order via Edge Function
          // S2 fix: Client sends only plan and vendor_id; server determines amount from canonical prices.
          const { data: orderData, error: orderError } =
            await supabase.functions.invoke("create-razorpay-order", {
              body: {
                // amount is intentionally NOT sent — the server derives it from the plan
                amount: 0, // placeholder, overridden server-side
                currency: "INR",
                receipt: `sub_${vendorId}_${plan}_${Date.now()}`,
                notes: {
                  type: "subscription",
                  vendor_id: vendorId,
                  user_id: user.id,
                  plan,
                  interval,
                },
              },
            });

          if (orderError || !orderData?.order_id) {
            set({ loading: false });
            return {
              success: false,
              error:
                orderError?.message ||
                "Failed to create subscription order. Please try again.",
            };
          }

          set({ loading: false });
          return {
            success: true,
            orderId: orderData.order_id,
          };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      cancelSubscription: async () => {
        try {
          set({ loading: true, error: null });

          const current = get().subscription;
          if (!current) {
            set({ loading: false });
            return { success: false, error: "No active subscription" };
          }

          const { data, error } = await supabase.rpc("cancel_vendor_subscription", {
            subscription_id_input: current.id,
          });

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          if (data && data.success === false) {
            set({ error: data.error || "Failed to cancel subscription", loading: false });
            return { success: false, error: data.error };
          }

          set((state) => ({
            subscription: state.subscription
              ? { ...state.subscription, status: "cancelled" as SubscriptionStatus }
              : null,
            loading: false,
          }));

          trackEvent("subscription_cancelled", {
            plan: current.plan,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      getPlanInfo: () => {
        const plan = get().subscription?.plan || "free";
        return SUBSCRIPTION_PLANS.find((p) => p.id === plan) || SUBSCRIPTION_PLANS[0];
      },

      hasFeature: (feature: string) => {
        const plan = get().subscription?.plan || "free";
        const planInfo = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
        if (!planInfo) return false;
        return planInfo.features.some((f) =>
          f.toLowerCase().includes(feature.toLowerCase())
        );
      },

      getRemainingLeadCredits: () => {
        return get().subscription?.leadCredits ?? 5;
      },

      isFeatured: () => {
        const sub = get().subscription;
        if (!sub) return false;
        if (sub.plan === "premium" || sub.plan === "elite") {
          // Check if featured period hasn't expired
          if (sub.featuredUntil) {
            return new Date(sub.featuredUntil) > new Date();
          }
          return sub.status === "active";
        }
        return false;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);