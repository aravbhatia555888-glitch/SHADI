import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import React from "react";
import {
Modal,
Platform,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

type Priority = "high" | "medium" | "low";

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  priority: Priority;
}

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  task: TaskFormData;
  onTaskChange: (updater: (prev: TaskFormData) => TaskFormData) => void;
  adding: boolean;
}

function AddTaskModal({
  visible,
  onClose,
  onSubmit,
  task,
  onTaskChange,
  adding,
}: AddTaskModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Task</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={task.title}
            onChangeText={(text) =>
              onTaskChange((t) => ({ ...t, title: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={task.description}
            onChangeText={(text) =>
              onTaskChange((t) => ({ ...t, description: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={task.category}
            onChangeText={(text) =>
              onTaskChange((t) => ({ ...t, category: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Due Date (YYYY-MM-DD)"
            value={task.dueDate}
            onChangeText={(text) =>
              onTaskChange((t) => ({ ...t, dueDate: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <View style={styles.priorityRow}>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  task.priority === p && styles.activePriorityButton,
                ]}
                onPress={() => onTaskChange((t) => ({ ...t, priority: p }))}
                accessibilityRole="button"
                accessibilityLabel={`${p} priority`}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    task.priority === p && styles.activePriorityButtonText,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.modalButtonLeft}
            />
            <Button
              title={adding ? "Adding..." : "Add Task"}
              onPress={onSubmit}
              disabled={adding}
              style={styles.modalButtonRight}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(AddTaskModal);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.shadow,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 4,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.light.text,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  priorityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 2,
    padding: 10,
    alignItems: "center",
  },
  activePriorityButton: {
    backgroundColor: Colors.light.primary,
  },
  priorityButtonText: {
    color: Colors.light.text,
  },
  activePriorityButtonText: {
    color: Colors.light.background,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButtonLeft: {
    flex: 1,
    marginRight: 8,
  },
  modalButtonRight: {
    flex: 1,
    marginLeft: 8,
  },
});
