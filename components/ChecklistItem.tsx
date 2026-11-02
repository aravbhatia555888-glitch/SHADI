import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { ChecklistItem as ChecklistItemType } from "@/schemas/wedding";
import { hapticSelection,hapticSuccess } from "@/utils/haptics";
import { CheckCircle2,Circle } from "lucide-react-native";
import { useEffect,useState } from "react";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string, completed: boolean) => Promise<boolean>;
}

export default function ChecklistItem({ item, onToggle }: ChecklistItemProps) {
  const [completed, setCompleted] = useState(item.completed);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setCompleted(item.completed);
  }, [item.completed]);

  const handleToggle = async () => {
    if (pending) return;
    const previous = completed;
    const newStatus = !previous;

    setCompleted(newStatus);
    setPending(true);
    if (newStatus) {
      hapticSuccess();
    } else {
      hapticSelection();
    }

    let saved = false;
    try {
      saved = await onToggle(item.id, newStatus);
    } catch {
      saved = false;
    }
    setPending(false);
    if (!saved) {
      setCompleted(previous);
    }
  };

  const getDueStatusColor = () => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);

    if (completed) return Colors.light.success;

    if (dueDate < today) return Colors.light.error;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    if (dueDate <= sevenDaysFromNow) return Colors.light.warning;

    return Colors.light.textLight;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, completed && styles.completedContainer]}
      onPress={handleToggle}
      activeOpacity={0.7}
      disabled={pending}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed, disabled: pending }}
      accessibilityLabel={`${item.title}, ${
        completed ? "completed" : "not completed"
      }, due ${formatDueDate(item.dueDate)}`}
    >
      <View style={styles.checkboxContainer}>
        {completed ? (
          <CheckCircle2
            size={24}
            color={Colors.light.success}
            fill={Colors.light.success}
            strokeWidth={1.5}
          />
        ) : (
          <Circle size={24} color={Colors.light.textLight} strokeWidth={1.5} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, completed && styles.completedText]}>
          {item.title}
        </Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <View style={styles.dateContainer}>
        <Text style={[styles.date, { color: getDueStatusColor() }]}>
          {formatDueDate(item.dueDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  completedContainer: {
    backgroundColor: Colors.light.backgroundAlt,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.light.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: Colors.light.textLight,
  },
  category: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  dateContainer: {
    marginLeft: 8,
  },
  date: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});
