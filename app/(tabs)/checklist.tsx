import Button from "@/components/Button";
import ChecklistItem from "@/components/ChecklistItem";
import DatePicker from "@/components/DatePicker";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { ChecklistItem as ChecklistItemType } from "@/schemas/wedding";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { hapticSuccess } from "@/utils/haptics";
import { useLocalSearchParams,useNavigation,useRouter } from "expo-router";
import { Filter,Plus,Sparkles,X } from "lucide-react-native";
import {
useEffect,
useLayoutEffect,
useMemo,
useRef,
useState,
} from "react";
import {
ActivityIndicator,
Animated,
FlatList,
Modal,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

const filterOptions = ["All", "Pending", "Completed"];
const sortOptions = ["Due Date", "Priority", "Category"];

interface GeneratedTask {
  title: string;
  description?: string;
  category?: string;
  priority?: "high" | "medium" | "low";
  suggestedDueDate?: string;
}

// Converts an AI "X months/weeks/days before" suggestion into a real date
// relative to the wedding date (or +30 days when no date is available).
function resolveSuggestedDueDate(
  suggestion: string | undefined,
  weddingDate: string | undefined
): string {
  const toLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  };

  const base = weddingDate ? new Date(weddingDate) : new Date();
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);

  if (!suggestion || isNaN(base.getTime())) return toLocalDate(fallback);

  const match = suggestion.match(/(\d+)\s*(month|week|day)s?\s*before/i);
  const target = new Date(base);
  if (match) {
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.startsWith("month")) target.setMonth(target.getMonth() - n);
    else if (unit.startsWith("week")) target.setDate(target.getDate() - 7 * n);
    else target.setDate(target.getDate() - n);
  } else if (/day\s*before/i.test(suggestion)) {
    target.setDate(target.getDate() - 1);
  } else if (/week\s*before/i.test(suggestion)) {
    target.setDate(target.getDate() - 7);
  } else if (/month\s*before/i.test(suggestion)) {
    target.setMonth(target.getMonth() - 1);
  } else {
    return toLocalDate(fallback);
  }

  return toLocalDate(target);
}

export default function ChecklistScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { generated } = useLocalSearchParams<{ generated?: string }>();
  const { user } = useAuthStore();
  const {
    checklistItems,
    weddingDetails,
    loading,
    error,
    initialize,
    updateChecklistItem,
    addChecklistItem,
  } = useWeddingStore();
  const appliedGeneratedRef = useRef(false);

  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Due Date");
  const [filteredItems, setFilteredItems] =
    useState<ChecklistItemType[]>(checklistItems);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    dueDate: "",
    priority: "medium" as "high" | "medium" | "low",
  });
  const [adding, setAdding] = useState(false);

  const [tempFilter, setTempFilter] = useState(filter);
  const [tempSort, setTempSort] = useState(sort);
  const [tempCategory, setTempCategory] = useState<string | null>(
    selectedCategory
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter !== "All") count++;
    if (selectedCategory) count++;
    if (sort !== "Due Date") count++;
    return count;
  }, [filter, selectedCategory, sort]);

  useLayoutEffect(() => {
    const activeCount = activeFilterCount;
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity
            style={styles.headerAddButton}
            onPress={() => setAddModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add new task"
            testID="add-task-button"
          >
            <Plus size={20} color={Colors.light.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerFilterButton}
            onPress={() => {
              setTempFilter(filter);
              setTempSort(sort);
              setTempCategory(selectedCategory);
              setFilterModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Filter and sort${
              activeCount > 0 ? `, ${activeCount} active` : ""
            }`}
          >
            <Filter size={20} color={Colors.light.background} />
            {activeCount > 0 && (
              <View style={styles.headerFilterBadge}>
                <Text style={styles.headerFilterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, filter, sort, selectedCategory, activeFilterCount]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Apply tasks generated by the AI checklist screen (app/generate-checklist.tsx)
  useEffect(() => {
    if (!generated || appliedGeneratedRef.current) return;
    appliedGeneratedRef.current = true;

    try {
      const tasks = JSON.parse(generated) as GeneratedTask[];
      if (!Array.isArray(tasks) || tasks.length === 0) return;
      (async () => {
        let added = 0;
        for (const task of tasks) {
          if (!task?.title) continue;
          const result = await addChecklistItem({
            title: task.title,
            description: task.description || "",
            category: task.category || "General",
            dueDate: resolveSuggestedDueDate(
              task.suggestedDueDate,
              weddingDetails?.weddingDate
            ),
            priority: task.priority || "medium",
            completed: false,
          });
          if (result.success) added++;
        }
        if (added > 0) {
          hapticSuccess();
          useToastStore
            .getState()
            .showToast(`${added} task${added === 1 ? "" : "s"} added from AI checklist`, "success");
        }
      })();
    } catch {
      // Malformed payload — ignore rather than crash the screen
    } finally {
      // Clear the param so returning to the tab doesn't re-apply the tasks
      router.setParams({ generated: undefined });
    }
  }, [
    generated,
    addChecklistItem,
    router,
    weddingDetails?.weddingDate,
  ]);

  useEffect(() => {
    let results = [...checklistItems];

    if (filter === "Pending") {
      results = results.filter((item) => !item.completed);
    } else if (filter === "Completed") {
      results = results.filter((item) => item.completed);
    }

    if (selectedCategory) {
      results = results.filter((item) => item.category === selectedCategory);
    }

    if (sort === "Due Date") {
      results.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    } else if (sort === "Priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      results.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else if (sort === "Category") {
      results.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(results);
  }, [checklistItems, filter, sort, selectedCategory]);

  const categories = useMemo(
    () => Array.from(new Set(checklistItems.map((item) => item.category))),
    [checklistItems]
  );

  const applyFilters = () => {
    setFilter(tempFilter);
    setSort(tempSort);
    setSelectedCategory(tempCategory);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setFilter("All");
    setSort("Due Date");
    setSelectedCategory(null);
    setTempFilter("All");
    setTempSort("Due Date");
    setTempCategory(null);
    setFilterModalVisible(false);
  };

  const handleToggleItem = async (id: string, completed: boolean) => {
    const result = await updateChecklistItem(id, completed);
    if (!result.success) {
      useToastStore
        .getState()
        .showToast(
          result.error || "Could not save the task. Try again.",
          "error"
        );
      return false;
    }
    return true;
  };

  const handleAddTask = async () => {
    setAdding(true);
    const result = await addChecklistItem({
      ...newTask,
      priority: newTask.priority as "high" | "medium" | "low",
      completed: false,
    });
    setAdding(false);
    if (result.success) {
      hapticSuccess();
      setAddModalVisible(false);
      setNewTask({
        title: "",
        description: "",
        category: "",
        dueDate: "",
        priority: "medium",
      });
    } else {
      useToastStore.getState().showToast(result.error || "Failed to add task", "error");
    }
  };

  const renderProgressBar = () => {
    const completedCount = checklistItems.filter(
      (item) => item.completed
    ).length;
    const totalCount = checklistItems.length;
    const progressPercentage =
      totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const pendingCount = totalCount - completedCount;
    const highPriorityCount = checklistItems.filter(
      (i) => i.priority === "high" && !i.completed
    ).length;
    const dueThisWeekCount = checklistItems.filter((i) => {
      const dueDate = new Date(i.dueDate);
      const today = new Date();
      const diffDays = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7 && diffDays >= 0 && !i.completed;
    }).length;

    return (
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressPercentageLarge}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[styles.progressBar, { width: `${progressPercentage}%` }]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statDot} />
            <Text style={styles.statText}>{completedCount} completed</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, styles.statDotPending]} />
            <Text style={styles.statText}>{pendingCount} remaining</Text>
          </View>
        </View>

        <View style={styles.quickStatsPills}>
          {highPriorityCount > 0 && (
            <View style={styles.statPill}>
              <View style={styles.statPillDot} />
              <Text style={styles.statPillText}>
                High Priority ({highPriorityCount})
              </Text>
            </View>
          )}
          {dueThisWeekCount > 0 && (
            <View style={[styles.statPill, styles.statPillWarning]}>
              <View style={[styles.statPillDot, styles.statPillDotWarning]} />
              <Text style={[styles.statPillText, styles.statPillTextWarning]}>
                Due This Week ({dueThisWeekCount})
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const retryLoad = () => {
    if (user?.id) initialize(user.id);
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryLoad}
            accessibilityRole="button"
            accessibilityLabel="Retry loading tasks"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderProgressBar()
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChecklistItem item={item} onToggle={handleToggleItem} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : error ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks found</Text>
              <Text style={styles.emptySubtext}>
                {selectedCategory
                  ? `No tasks in ${selectedCategory}`
                  : filter === "All"
                  ? "Add your first task to get started"
                  : `No ${filter.toLowerCase()} tasks`}
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Filter size={24} color={Colors.light.primary} />
                <Text style={styles.modalTitle}>Filter & Sort</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFilterModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close filter modal"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterOptionsGrid}>
                  {filterOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOptionButton,
                        tempFilter === option &&
                          styles.activeFilterOptionButton,
                      ]}
                      onPress={() => setTempFilter(option)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${option}${
                        tempFilter === option ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilter === option &&
                            styles.activeFilterOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.filterOptionsGrid}>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOptionButton,
                        tempSort === option && styles.activeFilterOptionButton,
                      ]}
                      onPress={() => setTempSort(option)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sort by ${option}${
                        tempSort === option ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempSort === option && styles.activeFilterOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Category</Text>
                  <View style={styles.filterOptionsGrid}>
                    <TouchableOpacity
                      style={[
                        styles.filterOptionButton,
                        !tempCategory && styles.activeFilterOptionButton,
                      ]}
                      onPress={() => setTempCategory(null)}
                      accessibilityRole="button"
                      accessibilityLabel={`All categories${
                        !tempCategory ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          !tempCategory && styles.activeFilterOptionText,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterOptionButton,
                          tempCategory === category &&
                            styles.activeFilterOptionButton,
                        ]}
                        onPress={() => setTempCategory(category)}
                        accessibilityRole="button"
                        accessibilityLabel={`${category} category${
                          tempCategory === category ? ", selected" : ""
                        }`}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempCategory === category &&
                              styles.activeFilterOptionText,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Reset"
                onPress={resetFilters}
                variant="outline"
                style={styles.modalButtonLeft}
              />
              <Button
                title="Apply Filters"
                onPress={applyFilters}
                style={styles.modalButtonRight}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Sparkles size={24} color={Colors.light.primary} />
              <Text style={styles.modalTitle}>Add New Task</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Task Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Book wedding venue"
                  value={newTask.title}
                  onChangeText={(text) =>
                    setNewTask((t) => ({ ...t, title: text }))
                  }
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add details about this task..."
                  value={newTask.description}
                  onChangeText={(text) =>
                    setNewTask((t) => ({ ...t, description: text }))
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Venue, Catering, Decor"
                  value={newTask.category}
                  onChangeText={(text) =>
                    setNewTask((t) => ({ ...t, category: text }))
                  }
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <DatePicker
                  value={newTask.dueDate ? new Date(newTask.dueDate) : null}
                  onChange={(date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setNewTask((t) => ({ ...t, dueDate: `${year}-${month}-${day}` }));
                  }}
                  placeholder="Select due date"
                  label="Due Date *"
                  minimumDate={new Date()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority *</Text>
                <View style={styles.priorityContainer}>
                  {(["high", "medium", "low"] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        newTask.priority === p && styles.activePriorityButton,
                        p === "high" &&
                          newTask.priority === p &&
                          styles.highPriority,
                        p === "medium" &&
                          newTask.priority === p &&
                          styles.mediumPriority,
                        p === "low" &&
                          newTask.priority === p &&
                          styles.lowPriority,
                      ]}
                      onPress={() => setNewTask((t) => ({ ...t, priority: p }))}
                      accessibilityRole="button"
                      accessibilityLabel={`${p} priority${
                        newTask.priority === p ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          newTask.priority === p && styles.activePriorityText,
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setAddModalVisible(false);
                  setNewTask({
                    title: "",
                    description: "",
                    category: "",
                    dueDate: "",
                    priority: "medium",
                  });
                }}
                variant="outline"
                style={styles.modalButtonLeft}
              />
              <Button
                title={adding ? "Adding..." : "Add Task"}
                onPress={handleAddTask}
                disabled={
                  adding ||
                  !newTask.title ||
                  !newTask.category ||
                  !newTask.dueDate
                }
                style={styles.modalButtonRight}
              />
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
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerFilterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.light.headerBackground,
  },
  headerFilterBadgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    color: Colors.light.background,
  },
  heroSection: {
    backgroundColor: Colors.light.headerBackground,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.2,
  },
  progressPercentageLarge: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.background,
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2.5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.successOnDark,
    borderRadius: 2.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.successOnDark,
  },
  statDotPending: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  statText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  quickStatsPills: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statPillWarning: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
  },
  statPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.errorOnDark,
  },
  statPillDotWarning: {
    backgroundColor: Colors.light.warningOnDark,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.errorOnDark,
  },
  statPillTextWarning: {
    color: Colors.light.warningOnDark,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },
  filterOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOptionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
  },
  activeFilterOptionButton: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterOptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "500",
  },
  activeFilterOptionText: {
    color: Colors.light.background,
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 40,
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
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  retryText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  emptyText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
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
    maxHeight: "90%",
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    padding: Platform.OS === "ios" ? 14 : 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundAlt,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    padding: Platform.OS === "ios" ? 14 : 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: "center",
  },
  activePriorityButton: {
    borderColor: Colors.light.primary,
  },
  highPriority: {
    backgroundColor: Colors.light.priorityHighBg,
    borderColor: Colors.light.error,
  },
  mediumPriority: {
    backgroundColor: Colors.light.priorityMediumBg,
    borderColor: Colors.light.warning,
  },
  lowPriority: {
    backgroundColor: Colors.light.priorityLowBg,
    borderColor: Colors.light.info,
  },
  priorityText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "500",
  },
  activePriorityText: {
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
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
