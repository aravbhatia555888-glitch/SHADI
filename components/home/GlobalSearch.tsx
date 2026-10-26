import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { BudgetItem,ChecklistItem,Vendor } from "@/schemas/wedding";
import { CheckCircle2,DollarSign,Search,Store } from "lucide-react-native";
import React from "react";
import {
Modal,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

interface SearchResults {
  vendors: Vendor[];
  tasks: ChecklistItem[];
  budget: BudgetItem[];
}

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResults;
  onVendorPress: (vendor: Vendor) => void;
  onTaskPress: (task: ChecklistItem) => void;
  onBudgetPress: (item: BudgetItem) => void;
}

function GlobalSearch({
  visible,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  onVendorPress,
  onTaskPress,
  onBudgetPress,
}: GlobalSearchProps) {
  const hasResults =
    searchResults.vendors.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.budget.length > 0;

  const isEmptyQuery = searchQuery.trim() === "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TextInput
              style={styles.input}
              placeholder="Search vendors, tasks, budget..."
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
              placeholderTextColor={Colors.light.textLight}
              accessibilityLabel="Search input"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.results}
            showsVerticalScrollIndicator={false}
          >
            {isEmptyQuery ? (
              <View style={styles.emptyState}>
                <Search size={48} color={Colors.light.textLight} />
                <Text style={styles.emptyTitle}>Search Everything</Text>
                <Text style={styles.emptySubtitle}>
                  Find vendors, tasks, budget items, and more
                </Text>
              </View>
            ) : (
              <>
                {searchResults.vendors.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vendors</Text>
                    {searchResults.vendors.map((vendor) => (
                      <TouchableOpacity
                        key={vendor.id}
                        style={styles.resultItem}
                        onPress={() => onVendorPress(vendor)}
                        accessibilityRole="button"
                        accessibilityLabel={`View vendor ${vendor.name}`}
                      >
                        <View style={styles.resultIcon}>
                          <Store size={20} color={Colors.light.primary} />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{vendor.name}</Text>
                          <Text style={styles.resultSubtitle}>
                            {vendor.category} •{" "}
                            {typeof vendor.location === "string"
                              ? vendor.location
                              : vendor.location.city}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchResults.tasks.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tasks</Text>
                    {searchResults.tasks.map((task) => (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.resultItem}
                        onPress={() => onTaskPress(task)}
                        accessibilityRole="button"
                        accessibilityLabel={`View task ${task.title}`}
                      >
                        <View style={styles.resultIcon}>
                          <CheckCircle2
                            size={20}
                            color={
                              task.completed
                                ? Colors.light.success
                                : Colors.light.textLight
                            }
                          />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{task.title}</Text>
                          <Text style={styles.resultSubtitle}>
                            {task.category} •{" "}
                            {task.completed ? "Completed" : "Pending"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchResults.budget.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Budget</Text>
                    {searchResults.budget.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => onBudgetPress(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`View budget ${item.category}`}
                      >
                        <View style={styles.resultIcon}>
                          <DollarSign size={20} color={Colors.light.primary} />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>
                            {item.category}
                          </Text>
                          <Text style={styles.resultSubtitle}>
                            ₹{item.estimated.toLocaleString()} estimated • ₹
                            {item.spent.toLocaleString()} spent
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!hasResults && (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsTitle}>No results found</Text>
                    <Text style={styles.noResultsSubtitle}>
                      Try searching for vendors, tasks, or budget categories
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(GlobalSearch);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flex: 1,
    backgroundColor: Colors.light.background,
    marginTop: Platform.OS === "ios" ? 50 : 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 25,
    marginRight: 12,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  results: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
  },
});
