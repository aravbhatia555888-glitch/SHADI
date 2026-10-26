import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { BudgetItem as BudgetItemType } from "@/schemas/wedding";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface BudgetItemProps {
  item: BudgetItemType;
  onPress: (item: BudgetItemType) => void;
}

export default function BudgetItem({ item, onPress }: BudgetItemProps) {
  const progress = item.estimated > 0 ? (item.spent / item.estimated) * 100 : 0;

  const getProgressColor = () => {
    if (item.estimated <= 0) return Colors.light.success;
    const ratio = item.spent / item.estimated;
    if (ratio > 1) return Colors.light.error;
    if (ratio > 0.8) return Colors.light.warning;
    return Colors.light.success;
  };

  const progressWidth = Math.min(100, progress);

  const statusText =
    item.estimated <= 0
      ? "No budget set"
      : item.spent > item.estimated
      ? "Over budget"
      : `${Math.round(progress)}% used`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessible={false}
      testID="budget-item"
      accessibilityLabel={`${
        item.category
      } budget: ₹${item.spent.toLocaleString()} of ₹${item.estimated.toLocaleString()}, ${statusText}`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{item.category}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.spent}>₹{item.spent.toLocaleString()}</Text>
          <Text style={styles.estimated}>
            {" "}
            / ₹{item.estimated.toLocaleString()}
          </Text>
        </View>
      </View>

      <View
        style={styles.progressContainer}
        testID="budget-progressbar"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(progress), min: 0, max: 100 }}
      >
        <View
          style={[
            styles.progressBar,
            { width: `${progressWidth}%`, backgroundColor: getProgressColor() },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.itemCount}>{item.items.length} items</Text>
        <Text style={[styles.status, { color: getProgressColor() }]}>
          {statusText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spent: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.text,
  },
  estimated: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  status: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});
