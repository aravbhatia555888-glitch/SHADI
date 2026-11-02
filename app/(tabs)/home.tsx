import AddExpenseModal from "@/components/home/AddExpenseModal";
import AddTaskModal from "@/components/home/AddTaskModal";
import FeaturedVendors from "@/components/home/FeaturedVendors";
import GlobalSearch from "@/components/home/GlobalSearch";
import HomeHeader from "@/components/home/HomeHeader";
import InspirationPreview from "@/components/home/InspirationPreview";
import QuickActions from "@/components/home/QuickActions";
import RecentActivity from "@/components/home/RecentActivity";
import RoleHome from "@/components/home/RoleHome";
import WeddingProgress from "@/components/home/WeddingProgress";
import Colors from "@/constants/colors";
import { BudgetItem,ChecklistItem as ChecklistItemType,Vendor } from "@/schemas/wedding";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { useNavigation,useRouter } from "expo-router";
import { Bell,Search } from "lucide-react-native";
import {
useEffect,
useLayoutEffect,
useMemo,
useRef,
useState,
} from "react";
import {
Animated,
FlatList,
StyleSheet,
TouchableOpacity,
View,
} from "react-native";

type Priority = "high" | "medium" | "low";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const {
    weddingDetails,
    vendors,
    checklistItems,
    budgetItems,
    addChecklistItem,
    addBudgetExpense,
  } = useWeddingStore();

  const featuredVendors = useMemo(
    () => vendors.filter((v) => v.featured).slice(0, 3),
    [vendors]
  );
  const pendingTasks = useMemo(
    () => checklistItems.filter((item) => !item.completed),
    [checklistItems]
  );
  const totalBudget = useMemo(
    () =>
      weddingDetails?.totalBudget ||
      budgetItems.reduce((sum, item) => sum + item.estimated, 0),
    [weddingDetails?.totalBudget, budgetItems]
  );
  const totalSpent = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.spent, 0),
    [budgetItems]
  );
  const budgetPercentage = useMemo(
    () => (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0),
    [totalBudget, totalSpent]
  );

  const coupleName = weddingDetails?.coupleName || "Your Wedding";
  const weddingDate = weddingDetails?.weddingDate || new Date().toISOString();
  const weddingLocation = weddingDetails?.weddingLocation || "Location TBD";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setSearchModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Search size={22} color={Colors.light.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={22} color={Colors.light.background} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const navigateToVendor = (vendor: Vendor) => {
    router.push({ pathname: "/vendor/[id]", params: { id: vendor.id } });
  };

  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    dueDate: "",
    priority: "medium" as Priority,
  });
  const [addingTask, setAddingTask] = useState(false);

  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    budgetItemId: budgetItems[0]?.id || "",
    name: "",
    amount: "",
    date: "",
    paid: false,
    vendor: "",
    notes: "",
  });
  const [addingExpense, setAddingExpense] = useState(false);

  type Section =
    | "header"
    | "wedding-progress"
    | "featured-vendors"
    | "quick-actions"
    | "recent-activity"
    | "inspiration"
    | "spacer";

  const sections: Section[] = [
    "header",
    "wedding-progress",
    "featured-vendors",
    "quick-actions",
    "recent-activity",
    "inspiration",
    "spacer",
  ];

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    vendors: Vendor[];
    tasks: ChecklistItemType[];
    budget: BudgetItem[];
  }>({
    vendors: [],
    tasks: [],
    budget: [],
  });

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = (query: string) => {
    if (query.trim() === "") {
      setSearchResults({ vendors: [], tasks: [], budget: [] });
      return;
    }
    const q = query.toLowerCase();
    setSearchResults({
      vendors: vendors
        .filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            (typeof v.location === "string"
              ? v.location
              : `${v.location.city} ${v.location.state}`
            )
              .toLowerCase()
              .includes(q)
        )
        .slice(0, 5),
      tasks: checklistItems
        .filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        )
        .slice(0, 5),
      budget: budgetItems
        .filter((b) => b.category.toLowerCase().includes(q))
        .slice(0, 5),
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => performSearch(query), 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      useToastStore.getState().showToast("Please enter a task title", "warning");
      return;
    }
    if (!newTask.category.trim()) {
      useToastStore.getState().showToast("Please enter a category", "warning");
      return;
    }
    if (!newTask.dueDate.trim()) {
      useToastStore.getState().showToast("Please enter a due date", "warning");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newTask.dueDate)) {
      useToastStore.getState().showToast("Please enter a valid date in YYYY-MM-DD format", "warning");
      return;
    }

    setAddingTask(true);
    const result = await addChecklistItem({ ...newTask, completed: false });
    setAddingTask(false);
    if (result.success) {
      setAddTaskModalVisible(false);
      setNewTask({
        title: "",
        description: "",
        category: "",
        dueDate: "",
        priority: "medium",
      });
      useToastStore.getState().showToast("Task added successfully", "success");
    } else {
      useToastStore.getState().showToast(result.error || "Failed to add task", "error");
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.name.trim()) {
      useToastStore.getState().showToast("Please enter an expense name", "warning");
      return;
    }
    if (
      !newExpense.amount.trim() ||
      isNaN(Number(newExpense.amount)) ||
      Number(newExpense.amount) <= 0
    ) {
      useToastStore.getState().showToast("Please enter a valid amount", "warning");
      return;
    }
    if (!newExpense.date.trim()) {
      useToastStore.getState().showToast("Please enter a date", "warning");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpense.date)) {
      useToastStore.getState().showToast("Please enter a valid date in YYYY-MM-DD format", "warning");
      return;
    }
    if (!newExpense.budgetItemId) {
      useToastStore.getState().showToast("Please select a budget category", "warning");
      return;
    }

    setAddingExpense(true);
    const result = await addBudgetExpense(newExpense.budgetItemId, {
      name: newExpense.name,
      amount: Number(newExpense.amount),
      date: newExpense.date,
      paid: newExpense.paid,
      vendor: newExpense.vendor,
      notes: newExpense.notes,
    });
    setAddingExpense(false);
    if (result.success) {
      setAddExpenseModalVisible(false);
      setNewExpense({
        budgetItemId: budgetItems[0]?.id || "",
        name: "",
        amount: "",
        date: "",
        paid: false,
        vendor: "",
        notes: "",
      });
      useToastStore.getState().showToast("Expense added successfully", "success");
    } else {
      useToastStore.getState().showToast(result.error || "Failed to add expense", "error");
    }
  };

  const handleSearchClose = () => {
    setSearchModalVisible(false);
    setSearchQuery("");
    setSearchResults({ vendors: [], tasks: [], budget: [] });
  };

  const renderSection = ({ item }: { item: Section }) => {
    switch (item) {
      case "header":
        return (
          <HomeHeader
            coupleName={coupleName}
            weddingDate={weddingDate}
            weddingLocation={weddingLocation}
            onProfilePress={() => router.push("/(tabs)/profile")}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />
        );
      case "wedding-progress":
        return (
          <WeddingProgress
            pendingTasksCount={pendingTasks.length}
            totalTasksCount={checklistItems.length}
            budgetPercentage={budgetPercentage}
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            onBudgetPress={() => router.push("/budget")}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />
        );
      case "featured-vendors":
        return (
          <FeaturedVendors
            vendors={featuredVendors}
            onVendorPress={navigateToVendor}
            onViewAllPress={() => router.push("/vendors")}
          />
        );
      case "quick-actions":
        return (
          <QuickActions
            onAddTaskPress={() => setAddTaskModalVisible(true)}
            onAddExpensePress={() => setAddExpenseModalVisible(true)}
            onBudgetPress={() => router.push("/budget")}
            onVendorsPress={() => router.push("/vendors")}
            onWeddingCardsPress={() => router.push("/wedding-cards")}
          />
        );
      case "recent-activity":
        return (
          <RecentActivity
            pendingTasks={pendingTasks}
            onTaskPress={() => router.push("/(tabs)/checklist")}
            onViewAllPress={() => router.push("/(tabs)/checklist")}
          />
        );
      case "inspiration":
        return (
          <InspirationPreview
            onArticlePress={() => router.push("/inspiration")}
            onViewAllPress={() => router.push("/inspiration")}
          />
        );
      case "spacer":
        return <View style={styles.bottomSpacing} />;
      default:
        return null;
    }
  };

  const keyExtractor = (item: Section) => item;

  if (user && (user.role === "vendor" || user.role === "explorer")) {
    return <RoleHome role={user.role} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={3}
      />

      <AddTaskModal
        visible={addTaskModalVisible}
        onClose={() => setAddTaskModalVisible(false)}
        onSubmit={handleAddTask}
        task={newTask}
        onTaskChange={setNewTask}
        adding={addingTask}
      />

      <AddExpenseModal
        visible={addExpenseModalVisible}
        onClose={() => setAddExpenseModalVisible(false)}
        onSubmit={handleAddExpense}
        expense={newExpense}
        onExpenseChange={setNewExpense}
        adding={addingExpense}
      />

      <GlobalSearch
        visible={searchModalVisible}
        onClose={handleSearchClose}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        searchResults={searchResults}
        onVendorPress={(vendor) => {
          setSearchModalVisible(false);
          navigateToVendor(vendor);
        }}
        onTaskPress={() => {
          setSearchModalVisible(false);
          router.push("/(tabs)/checklist");
        }}
        onBudgetPress={() => {
          setSearchModalVisible(false);
          router.push("/budget");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  headerBtn: {
    padding: 8,
    marginLeft: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});
