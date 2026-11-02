import BudgetItem from "@/components/BudgetItem";
import DatePicker from "@/components/DatePicker";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { hapticSuccess } from "@/utils/haptics";
import { useNavigation, useRouter } from "expo-router";
import {
ChevronLeft,
Filter,
Plus,
TrendingUp,
Wallet,
X,
} from "lucide-react-native";
import {
useCallback,
useEffect,
useLayoutEffect,
useMemo,
useRef,
useState,
} from "react";
import {
ActivityIndicator,
Animated,
Modal,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

// Single-currency for v1 (INR). Multi-currency not wired to budget_expenses table.

// Build a local "YYYY-MM-DD" string. toISOString() would shift the day for
// timezones east of UTC (e.g. IST -> previous day near midnight).
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type SortOption = "category" | "amount" | "spent";

export default function BudgetScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    budgetItems,
    weddingDetails,
    loading,
    error,
    initialize,
    addBudgetExpense,
    addBudgetCategory,
  } = useWeddingStore();

  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("category");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    category: "",
    estimated: "",
  });
  const [addingCategory, setAddingCategory] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    date: "",
    vendor: "",
    notes: "",
    budgetItemId: "",
    paid: false,
  });
  const [adding, setAdding] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openAddExpense = useCallback(() => {
    if (budgetItems.length === 0) {
      setAddCategoryModalVisible(true);
      return;
    }
    setAddExpenseModalVisible(true);
  }, [budgetItems.length]);

  useEffect(() => {
    if (user?.id) initialize(user.id);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, initialize, user?.id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={Colors.light.background} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openAddExpense}
            accessibilityRole="button"
            accessibilityLabel={
              budgetItems.length === 0 ? "Create budget category" : "Add expense"
            }
          >
            <Plus size={20} color={Colors.light.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFilterModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter and sort"
          >
            <Filter size={20} color={Colors.light.background} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, router, openAddExpense, budgetItems.length]);

  const totalEstimated =
    weddingDetails?.totalBudget ||
    budgetItems.reduce((sum, item) => sum + item.estimated, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const remainingBudget = totalEstimated - totalSpent;
  const budgetPercentage =
    totalEstimated > 0 ? Math.round((totalSpent / totalEstimated) * 100) : 0;

  const getBudgetStatusColor = () => {
    if (budgetPercentage > 100) return Colors.light.error;
    if (budgetPercentage > 90) return Colors.light.warning;
    return Colors.light.success;
  };

  const handleAddCategory = async () => {
    const category = newCategory.category.trim();
    const estimated = Number(newCategory.estimated.replace(/,/g, "").trim());

    if (!category) {
      useToastStore.getState().showToast("Enter a category name", "warning");
      return;
    }
    if (!newCategory.estimated.trim() || !Number.isFinite(estimated) || estimated < 0) {
      useToastStore
        .getState()
        .showToast("Enter a valid estimated budget", "warning");
      return;
    }

    setAddingCategory(true);
    const result = await addBudgetCategory({
      category,
      estimated,
      spent: 0,
    });
    setAddingCategory(false);

    if (result.success) {
      hapticSuccess();
      setAddCategoryModalVisible(false);
      setNewCategory({ category: "", estimated: "" });
      useToastStore
        .getState()
        .showToast("Budget category created", "success");
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Could not create category", "error");
    }
  };

  const retryLoad = () => {
    if (user?.id) initialize(user.id);
  };

  const closeAddExpense = () => {
    setAddExpenseModalVisible(false);
    setNewExpense({
      name: "",
      amount: "",
      date: "",
      vendor: "",
      notes: "",
      budgetItemId: "",
      paid: false,
    });
  };

  const closeAddCategory = () => {
    setAddCategoryModalVisible(false);
    setNewCategory({ category: "", estimated: "" });
  };

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.budgetItemId) {
        useToastStore.getState().showToast(
          "Please fill in all required fields",
          "warning"
        );
      return;
    }

    const amount = Number(newExpense.amount.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      useToastStore.getState().showToast("Enter a valid amount", "warning");
      return;
    }

    setAdding(true);
    try {
      const result = await addBudgetExpense(newExpense.budgetItemId, {
        name: newExpense.name,
        amount,
        date: newExpense.date || toLocalDateString(new Date()),
        vendor: newExpense.vendor,
        notes: newExpense.notes,
        paid: newExpense.paid,
      });

      if (result.success) {
        hapticSuccess();
        closeAddExpense();
        useToastStore.getState().showToast(
          "Expense added successfully!",
          "success"
        );
      } else {
        useToastStore.getState().showToast(
          result.error || "Failed to add expense",
          "error"
        );
      }
    } catch (_err) {
      useToastStore.getState().showToast(
        "An unexpected error occurred",
        "error"
      );
    } finally {
      setAdding(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = [...budgetItems];

    if (filterCategory) {
      items = items.filter((item) => item.category === filterCategory);
    }

    switch (sortBy) {
      case "amount":
        items.sort((a, b) => b.estimated - a.estimated);
        break;
      case "spent":
        items.sort((a, b) => b.spent - a.spent);
        break;
      case "category":
      default:
        items.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return items;
  }, [budgetItems, filterCategory, sortBy]);

  const categories = useMemo(() => {
    return Array.from(new Set(budgetItems.map((item) => item.category)));
  }, [budgetItems]);

  const canAddExpense =
    !adding &&
    !!newExpense.name &&
    !!newExpense.amount &&
    !!newExpense.budgetItemId;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryLoad}
            accessibilityRole="button"
            accessibilityLabel="Retry loading budget"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>Total Budget</Text>
          <Text style={styles.budgetAmount}>
            ₹{totalEstimated.toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(100, budgetPercentage)}%`,
                backgroundColor: getBudgetStatusColor(),
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconSmall}>
              <TrendingUp size={12} color={Colors.light.error} />
            </View>
            <View>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>
                ₹{totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconSmall, styles.remainingIcon]}>
              <Wallet size={12} color={Colors.light.success} />
            </View>
            <View>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>
                ₹{remainingBudget.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{budgetPercentage}%</Text>
          </View>
        </View>
      </Animated.View>
      )}

      <View style={styles.categoriesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Budget Categories {filterCategory && `• ${filterCategory}`}
          </Text>
          <Text style={styles.itemCount}>
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {loading && budgetItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              {budgetItems.length === 0 ? (
                <>
                  <Text style={styles.emptyText}>No budget categories yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create a category to start tracking what you plan to spend.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setAddCategoryModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Create budget category"
                  >
                    <Text style={styles.emptyButtonText}>Create Category</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No budget items found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your filters
                  </Text>
                </>
              )}
            </View>
          ) : (
            filteredItems.map((item) => (
              <BudgetItem key={item.id} item={item} />
            ))
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Filter size={24} color={Colors.light.primary} />
              <Text style={styles.modalTitle}>Filter & Sort</Text>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: "category" as SortOption, label: "Category" },
                  { value: "amount" as SortOption, label: "Budget Amount" },
                  { value: "spent" as SortOption, label: "Amount Spent" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      sortBy === option.value && styles.activeFilterOption,
                    ]}
                    onPress={() => setSortBy(option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}`}
                    accessibilityState={{ selected: sortBy === option.value }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        sortBy === option.value &&
                          styles.activeFilterOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filterCategory && styles.activeFilterOption,
                  ]}
                  onPress={() => setFilterCategory(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Show all categories"
                  accessibilityState={{ selected: !filterCategory }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !filterCategory && styles.activeFilterOptionText,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      filterCategory === category && styles.activeFilterOption,
                    ]}
                    onPress={() => setFilterCategory(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${category}`}
                    accessibilityState={{
                      selected: filterCategory === category,
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterCategory === category &&
                          styles.activeFilterOptionText,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonOutline]}
                onPress={() => {
                  setSortBy("category");
                  setFilterCategory(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Reset filters"
              >
                <Text style={styles.modalButtonTextOutline}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setFilterModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addCategoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddCategory}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Plus size={24} color={Colors.light.primary} />
              <Text style={styles.modalTitle}>New Budget Category</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeAddCategory}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Venue, Catering, Photography"
                value={newCategory.category}
                onChangeText={(text) =>
                  setNewCategory((c) => ({ ...c, category: text }))
                }
                placeholderTextColor={Colors.light.textLight}
                accessibilityLabel="Category name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Budget (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={newCategory.estimated}
                onChangeText={(text) =>
                  setNewCategory((c) => ({ ...c, estimated: text }))
                }
                keyboardType="numeric"
                placeholderTextColor={Colors.light.textLight}
                accessibilityLabel="Estimated budget in INR"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonOutline]}
                onPress={closeAddCategory}
                accessibilityRole="button"
                accessibilityLabel="Cancel creating category"
              >
                <Text style={styles.modalButtonTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (!newCategory.category.trim() ||
                    !newCategory.estimated.trim() ||
                    addingCategory) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleAddCategory}
                disabled={
                  addingCategory ||
                  !newCategory.category.trim() ||
                  !newCategory.estimated.trim()
                }
                accessibilityRole="button"
                accessibilityLabel="Create category"
                accessibilityState={{
                  disabled:
                    addingCategory ||
                    !newCategory.category.trim() ||
                    !newCategory.estimated.trim(),
                  busy: addingCategory,
                }}
              >
                <Text style={styles.modalButtonText}>
                  {addingCategory ? "Creating..." : "Create Category"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addExpenseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddExpense}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Plus size={24} color={Colors.light.primary} />
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeAddExpense}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                {budgetItems.length === 0 ? (
                  <Text style={styles.helperText}>
                    Create a budget category first.
                  </Text>
                ) : (
                  <View style={styles.categorySelector}>
                    {budgetItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.categoryOption,
                          newExpense.budgetItemId === item.id &&
                            styles.selectedCategoryOption,
                        ]}
                        onPress={() =>
                          setNewExpense((e) => ({
                            ...e,
                            budgetItemId: item.id,
                          }))
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${item.category} category`}
                        accessibilityState={{
                          selected: newExpense.budgetItemId === item.id,
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            newExpense.budgetItemId === item.id &&
                              styles.selectedCategoryOptionText,
                          ]}
                        >
                          {item.category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expense Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Venue deposit, Catering advance"
                  value={newExpense.name}
                  onChangeText={(text) =>
                    setNewExpense((e) => ({ ...e, name: text }))
                  }
                  placeholderTextColor={Colors.light.textLight}
                  accessibilityLabel="Expense name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount * (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newExpense.amount}
                  onChangeText={(text) =>
                    setNewExpense((e) => ({ ...e, amount: text }))
                  }
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.textLight}
                  accessibilityLabel="Expense amount in INR"
                />
              </View>

              <View style={styles.inputGroup}>
                <DatePicker
                  value={newExpense.date ? new Date(newExpense.date) : null}
                  onChange={(date) => {
                    setNewExpense((e) => ({ ...e, date: toLocalDateString(date) }));
                  }}
                  placeholder="Select date (optional)"
                  label="Date"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vendor</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vendor name (optional)"
                  value={newExpense.vendor}
                  onChangeText={(text) =>
                    setNewExpense((e) => ({ ...e, vendor: text }))
                  }
                  placeholderTextColor={Colors.light.textLight}
                  accessibilityLabel="Vendor name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes (optional)"
                  value={newExpense.notes}
                  onChangeText={(text) =>
                    setNewExpense((e) => ({ ...e, notes: text }))
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textLight}
                  accessibilityLabel="Expense notes"
                />
              </View>

              <TouchableOpacity
                style={styles.paidToggle}
                onPress={() => setNewExpense((e) => ({ ...e, paid: !e.paid }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: newExpense.paid }}
                accessibilityLabel="Mark as paid"
              >
                <View
                  style={[
                    styles.checkbox,
                    newExpense.paid && styles.checkedBox,
                  ]}
                >
                  {newExpense.paid && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.paidToggleText}>Mark as paid</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonOutline]}
                onPress={closeAddExpense}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding expense"
              >
                <Text style={styles.modalButtonTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  !canAddExpense && styles.modalButtonDisabled,
                ]}
                onPress={handleAddExpense}
                disabled={!canAddExpense}
                accessibilityRole="button"
                accessibilityLabel="Add expense"
                accessibilityState={{
                  disabled: !canAddExpense,
                  busy: adding,
                }}
              >
                <Text style={styles.modalButtonText}>
                  {adding ? "Adding..." : "Add Expense"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    backgroundColor: Colors.light.headerBackground,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  budgetTitle: {
    fontSize: 13,
    fontWeight: "600" as FontWeight,
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.2,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2.5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  remainingIcon: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500" as FontWeight,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
  },
  percentageBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
  },
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  bottomSpacing: {
    height: 20,
  },
  itemCount: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.backgroundAlt,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  closeButton: {
    marginLeft: "auto",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
  },
  activeFilterOption: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  activeFilterOptionText: {
    color: Colors.light.background,
    fontWeight: "600" as FontWeight,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonOutline: {
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  modalButtonTextOutline: {
    fontSize: 16,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    padding: Platform.OS === "ios" ? 14 : 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
  },
  selectedCategoryOption: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  selectedCategoryOptionText: {
    color: Colors.light.background,
    fontWeight: "600" as FontWeight,
  },
  paidToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  checkedBox: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.primary,
  },
  checkmark: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  paidToggleText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
});
