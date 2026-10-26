import Card from "@/components/Card";
import SubscriptionPaymentScreen from "@/components/SubscriptionPaymentScreen";
import { supabase } from "@/config/supabase";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { useAuthStore } from "@/stores/auth-store";
import { SUBSCRIPTION_PLANS,useSubscriptionStore } from "@/stores/subscription-store";
import { useVendorDashboardStore } from "@/stores/vendor-dashboard-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
ActivityIndicator,
RefreshControl,
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VendorDashboardScreen() {
  const [renderedAt] = useState(() => Date.now());
  const _router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { subscription, loading: subLoading, loadSubscription } = useSubscriptionStore();
  const { stats, recentInquiries, loading: dashLoading, loadDashboard } = useVendorDashboardStore();

  const [vendorId, setVendorId] = useState<string>("");
  const [vendorLoading, setVendorLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | "elite">("basic");

  const fetchVendor = useCallback(async () => {
    if (!user?.id) {
      setVendorLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.id) {
        setVendorId(data.id);
      } else {
        setVendorId("");
      }
    } catch (err) {
      if (__DEV__) console.warn("Failed to fetch vendor profile:", err);
      setVendorId("");
    } finally {
      setVendorLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      loadSubscription(vendorId);
      loadDashboard(vendorId);
    }
  }, [vendorId, loadSubscription, loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendor();
    if (vendorId) {
      await Promise.all([loadSubscription(vendorId), loadDashboard(vendorId)]);
    }
    setRefreshing(false);
  };

  const handleUpgrade = (plan: "basic" | "premium" | "elite") => {
    setSelectedPlan(plan);
    setPaymentModalVisible(true);
    trackEvent(AnalyticsEvents.SUBSCRIPTION_UPGRADED, { from: subscription?.plan || "free", to: plan });
  };

  const currentPlan = subscription?.plan || "free";
  const planRank: Record<string, number> = {
    free: 0,
    basic: 1,
    premium: 2,
    elite: 3,
  };
  const currentPlanInfo = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan) || SUBSCRIPTION_PLANS[0];
  const daysRemaining = subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - renderedAt) / (1000 * 60 * 60 * 24)))
    : 0;

  const inquiryCredits = subscription?.inquiryCredits ?? 5;
  const inquiryResponsesUsed = subscription?.inquiryResponsesUsed ?? 0;

  if (vendorLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!vendorId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Vendor Profile</Text>
          <Text style={styles.emptyText}>
            You need to create a vendor profile to access the dashboard.
          </Text>
        </View>
      </View>
    );
  }

  if (subLoading || dashLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Subscription Status Card */}
        <Card variant="elevated" style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionPlanName}>{currentPlanInfo.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: currentPlan === "free" ? Colors.light.textLight : Colors.light.success }]}>
              <Text style={styles.statusBadgeText}>{currentPlan === "free" ? "Free" : "Active"}</Text>
            </View>
          </View>
          <Text style={styles.subscriptionPrice}>
            ₹{currentPlanInfo.price.toLocaleString("en-IN")} / month
          </Text>
          {subscription && (
            <Text style={styles.daysRemaining}>{daysRemaining} days remaining</Text>
          )}
          {currentPlan !== "elite" && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => handleUpgrade(currentPlan === "free" ? "basic" : currentPlan === "basic" ? "premium" : "elite")}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Lead Stats Card */}
        <Card variant="elevated" style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Lead Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.light.primary }]}>{stats.new}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.light.success }]}>{stats.replied}</Text>
              <Text style={styles.statLabel}>Replied</Text>
            </View>
          </View>
          <View style={styles.creditsRow}>
            <Text style={styles.creditsLabel}>Credit Usage</Text>
            <Text style={styles.creditsValue}>
              {inquiryResponsesUsed} / {inquiryCredits} this month
            </Text>
          </View>
        </Card>

        {/* Recent Inquiries List */}
        <Card variant="elevated" style={styles.inquiriesCard}>
          <Text style={styles.sectionTitle}>Recent Inquiries</Text>
          {recentInquiries.length === 0 ? (
            <Text style={styles.emptyInquiries}>No inquiries yet</Text>
          ) : (
            recentInquiries.map((inquiry) => (
              <View key={inquiry.id} style={styles.inquiryItem}>
                <View style={styles.inquiryHeader}>
                  <Text style={styles.inquiryUserName}>{inquiry.userName}</Text>
                  <View style={[styles.inquiryStatusBadge, { backgroundColor: inquiry.status === "new" ? Colors.light.primary : Colors.light.success }]}>
                    <Text style={styles.inquiryStatusText}>{inquiry.status}</Text>
                  </View>
                </View>
                <Text style={styles.inquirySubject}>{inquiry.subject}</Text>
                <Text style={styles.inquiryMessage} numberOfLines={2}>
                  {inquiry.message}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Plan Comparison */}
        <Text style={styles.planComparisonTitle}>Available Plans</Text>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.id} variant="elevated" style={[styles.planCard, currentPlan === plan.id && styles.planCardActive]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, currentPlan === plan.id && styles.planNameActive]}>
                {plan.name}
              </Text>
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={styles.planPrice}>
              ₹{plan.price.toLocaleString("en-IN")} / month
            </Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {currentPlan !== plan.id &&
              plan.id !== "free" &&
              planRank[plan.id] > planRank[currentPlan] && (
                <TouchableOpacity
                  style={styles.planUpgradeButton}
                  onPress={() => handleUpgrade(plan.id as "basic" | "premium" | "elite")}
                >
                  <Text style={styles.planUpgradeButtonText}>
                    {currentPlan === "free" ? "Get Started" : "Upgrade"}
                  </Text>
                </TouchableOpacity>
              )}
            {currentPlan === plan.id && (
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanBadgeText}>Current Plan</Text>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* Subscription Payment Modal */}
      {user && (
        <SubscriptionPaymentScreen
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onComplete={(result) => {
            setPaymentModalVisible(false);
            if (result.success && vendorId) {
              loadSubscription(vendorId);
              loadDashboard(vendorId);
            }
          }}
          vendorId={vendorId}
          userId={user.id}
          plan={selectedPlan}
          userName={user.name || ""}
          userEmail={user.email || ""}
          userPhone=""
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
  },

  // Subscription Card
  subscriptionCard: {
    margin: 12,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subscriptionPlanName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  subscriptionPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  daysRemaining: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },

  // Stats Card
  statsCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
  },
  creditsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  creditsLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  creditsValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },

  // Inquiries Card
  inquiriesCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  emptyInquiries: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    paddingVertical: 24,
  },
  inquiryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  inquiryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  inquiryUserName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  inquiryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inquiryStatusText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  inquirySubject: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
    marginBottom: 2,
  },
  inquiryMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 18,
  },

  // Plan Comparison
  planComparisonTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  planCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  planNameActive: {
    color: Colors.light.primary,
  },
  popularBadge: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  planPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  featureCheck: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.success,
    marginRight: 8,
  },
  featureText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    flex: 1,
  },
  planUpgradeButton: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  planUpgradeButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  currentPlanBadge: {
    marginTop: 12,
    backgroundColor: Colors.light.success,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  currentPlanBadgeText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
});
