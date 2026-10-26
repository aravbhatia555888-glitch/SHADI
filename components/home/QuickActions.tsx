import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import {
DollarSign,
Palette,
Plus,
Sparkles,
Store,
} from "lucide-react-native";
import React from "react";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface QuickActionsProps {
  onAddTaskPress: () => void;
  onAddExpensePress: () => void;
  onBudgetPress: () => void;
  onVendorsPress: () => void;
  onAIPlannerPress: () => void;
  onWeddingCardsPress: () => void;
}

function QuickActions({
  onAddTaskPress,
  onAddExpensePress,
  onBudgetPress,
  onVendorsPress,
  onAIPlannerPress,
  onWeddingCardsPress,
}: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onAddTaskPress}
          accessibilityRole="button"
          accessibilityLabel="Add task"
        >
          <View style={styles.actionIconContainer}>
            <Plus size={20} color={Colors.light.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.actionCardText}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onAddExpensePress}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <View style={styles.actionIconContainer}>
            <Plus size={20} color={Colors.light.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.actionCardText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onBudgetPress}
          accessibilityRole="button"
          accessibilityLabel="View budget"
        >
          <View style={styles.actionIconContainer}>
            <DollarSign
              size={20}
              color={Colors.light.primary}
              strokeWidth={1.5}
            />
          </View>
          <Text style={styles.actionCardText}>Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onVendorsPress}
          accessibilityRole="button"
          accessibilityLabel="Browse vendors"
        >
          <View style={styles.actionIconContainer}>
            <Store size={20} color={Colors.light.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.actionCardText}>Vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onAIPlannerPress}
          accessibilityRole="button"
          accessibilityLabel="AI Wedding Planner"
        >
          <View style={styles.actionIconContainer}>
            <Sparkles
              size={20}
              color={Colors.light.primary}
              strokeWidth={1.5}
            />
          </View>
          <Text style={styles.actionCardText}>AI Planner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onWeddingCardsPress}
          accessibilityRole="button"
          accessibilityLabel="Wedding Cards"
        >
          <View style={styles.actionIconContainer}>
            <Palette size={20} color={Colors.light.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.actionCardText}>Cards</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(QuickActions);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  actionCard: {
    width: "30%",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCardText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
});
