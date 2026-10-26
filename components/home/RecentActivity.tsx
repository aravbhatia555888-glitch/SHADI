import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { ChecklistItem } from "@/schemas/wedding";
import { CheckCircle2,ChevronRight,Clock } from "lucide-react-native";
import React from "react";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface RecentActivityProps {
  pendingTasks: ChecklistItem[];
  onTaskPress: (task: ChecklistItem) => void;
  onViewAllPress: () => void;
}

function RecentActivity({
  pendingTasks,
  onTaskPress,
  onViewAllPress,
}: RecentActivityProps) {
  const displayTasks = pendingTasks.slice(0, 3);

  if (displayTasks.length === 0) {
    return null;
  }

  const priorityColor = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "high":
        return Colors.light.error;
      case "medium":
        return Colors.light.warning;
      case "low":
        return Colors.light.success;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          style={styles.viewAllButton}
          accessibilityRole="button"
          accessibilityLabel="View all tasks"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight
            size={16}
            color={Colors.light.primary}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {displayTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskItem}
          onPress={() => onTaskPress(task)}
          accessibilityRole="button"
          accessibilityLabel={`Task: ${task.title}, ${task.priority} priority`}
        >
          <View style={styles.taskIconContainer}>
            <CheckCircle2
              size={20}
              color={Colors.light.textLight}
              strokeWidth={1.5}
            />
          </View>
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <Clock
                size={12}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
              <Text style={styles.taskDueDate}>Due: {task.dueDate}</Text>
            </View>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColor(task.priority) + "20" },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                { color: priorityColor(task.priority) },
              ]}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default React.memo(RecentActivity);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueDate: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
  },
});
