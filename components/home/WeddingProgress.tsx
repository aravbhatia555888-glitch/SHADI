import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { CheckCircle2,DollarSign,TrendingUp } from "lucide-react-native";
import React from "react";
import {
Animated,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface WeddingProgressProps {
  pendingTasksCount: number;
  budgetPercentage: number;
  totalBudget: number;
  totalSpent: number;
  onBudgetPress: () => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

function WeddingProgress({
  pendingTasksCount,
  budgetPercentage,
  totalBudget,
  totalSpent,
  onBudgetPress,
  fadeAnim,
  scaleAnim,
}: WeddingProgressProps) {
  return (
    <>
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <CheckCircle2
              size={20}
              color={Colors.light.primary}
              strokeWidth={1.5}
            />
          </View>
          <Text style={styles.statValue}>{pendingTasksCount}</Text>
          <Text style={styles.statLabel}>Tasks Left</Text>
          <View style={styles.statProgress}>
            <View
              style={[
                styles.statProgressBar,
                {
                  width: `${Math.min(100, (pendingTasksCount / 20) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp
              size={20}
              color={Colors.light.primary}
              strokeWidth={1.5}
            />
          </View>
          <Text style={styles.statValue}>{budgetPercentage}%</Text>
          <Text style={styles.statLabel}>Budget Used</Text>
          <View style={styles.statProgress}>
            <View
              style={[
                styles.statProgressBar,
                { width: `${budgetPercentage}%` },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={styles.budgetSummaryCard}
        onPress={onBudgetPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Budget overview"
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetHeaderLeft}>
            <View style={styles.budgetIconContainer}>
              <DollarSign
                size={24}
                color={Colors.light.primary}
                strokeWidth={1.5}
              />
            </View>
            <View>
              <Text style={styles.budgetTitle}>Budget Overview</Text>
              <Text style={styles.budgetSubtitle}>Tap to view details</Text>
            </View>
          </View>
        </View>
        <View style={styles.budgetStats}>
          <View style={styles.budgetStatItem}>
            <Text style={styles.budgetStatLabel}>Total Budget</Text>
            <Text style={styles.budgetStatValue}>
              ₹{(totalBudget / 100000).toFixed(1)}L
            </Text>
          </View>
          <View style={styles.budgetStatDivider} />
          <View style={styles.budgetStatItem}>
            <Text style={styles.budgetStatLabel}>Spent</Text>
            <Text style={[styles.budgetStatValue, styles.spentValue]}>
              ₹{(totalSpent / 100000).toFixed(1)}L
            </Text>
          </View>
          <View style={styles.budgetStatDivider} />
          <View style={styles.budgetStatItem}>
            <Text style={styles.budgetStatLabel}>Remaining</Text>
            <Text style={[styles.budgetStatValue, styles.remainingValue]}>
              ₹{((totalBudget - totalSpent) / 100000).toFixed(1)}L
            </Text>
          </View>
        </View>
        <View style={styles.budgetProgressContainer}>
          <View style={styles.budgetProgressBar}>
            <View
              style={[
                styles.budgetProgressFill,
                { width: `${budgetPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.budgetProgressText}>
            {budgetPercentage}% used
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
}

export default React.memo(WeddingProgress);

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.softBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
  },
  statProgress: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  statProgressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  budgetSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  budgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.softBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },
  budgetSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  budgetStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  budgetStatItem: {
    flex: 1,
    alignItems: "center",
  },
  budgetStatLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  budgetStatValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },
  spentValue: {
    color: Colors.light.primary,
  },
  remainingValue: {
    color: Colors.light.success,
  },
  budgetStatDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  budgetProgressContainer: {
    gap: 8,
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetProgressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  budgetProgressText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    textAlign: "center",
  },
});
