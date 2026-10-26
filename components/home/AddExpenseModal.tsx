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
View,
} from "react-native";

interface ExpenseFormData {
  budgetItemId: string;
  name: string;
  amount: string;
  date: string;
  paid: boolean;
  vendor: string;
  notes: string;
}

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  expense: ExpenseFormData;
  onExpenseChange: (
    updater: (prev: ExpenseFormData) => ExpenseFormData
  ) => void;
  adding: boolean;
}

function AddExpenseModal({
  visible,
  onClose,
  onSubmit,
  expense,
  onExpenseChange,
  adding,
}: AddExpenseModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Expense</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={expense.name}
            onChangeText={(text) =>
              onExpenseChange((e) => ({ ...e, name: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={expense.amount}
            onChangeText={(text) =>
              onExpenseChange((e) => ({ ...e, amount: text }))
            }
            keyboardType="numeric"
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={expense.date}
            onChangeText={(text) =>
              onExpenseChange((e) => ({ ...e, date: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Vendor"
            value={expense.vendor}
            onChangeText={(text) =>
              onExpenseChange((e) => ({ ...e, vendor: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes"
            value={expense.notes}
            onChangeText={(text) =>
              onExpenseChange((e) => ({ ...e, notes: text }))
            }
            placeholderTextColor={Colors.light.textLight}
          />
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.modalButtonLeft}
            />
            <Button
              title={adding ? "Adding..." : "Add Expense"}
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

export default React.memo(AddExpenseModal);

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
