import Card from "@/components/Card";
import Colors from "@/constants/colors";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { pickAndUploadProfileImage } from "@/services/imageUpload";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { hapticSelection } from "@/utils/haptics";
import { type Href, useFocusEffect, useNavigation, useRouter } from "expo-router";
import {
Bell,
Calendar,
Camera,
ChevronRight,
Heart,
HelpCircle,
IndianRupee,
LayoutDashboard,
ListChecks,
LogOut,
MapPin,
Menu,
MessageCircle,
Settings,
Star
} from "lucide-react-native";
import React,{
useCallback,
useEffect,
useLayoutEffect,
useMemo,
useRef,
useState,
} from "react";
import {
ActivityIndicator,
Alert,
Animated,
Image,
ImageStyle,
Modal,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

function normalizeDateValue(value?: string) {
  if (!value) return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
}

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const {
    weddingDetails,
    setWeddingDetails,
    updateProfileImage,
    vendors,
    favoriteVendors,
    checklistItems,
    budgetItems,
    initialize,
  } = useWeddingStore();

  const DEFAULT_PROFILE_IMAGE =
    "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1296&q=80";
  const [profileImage, setProfileImage] = useState(
    user?.profileImageUrl || DEFAULT_PROFILE_IMAGE
  );

  // Restore the saved profile picture after login / data refresh. Previously
  // the image was always the hardcoded placeholder after an app restart.
  useEffect(() => {
    if (user?.profileImageUrl) {
      setProfileImage(user.profileImageUrl);
    }
  }, [user?.profileImageUrl]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDetails, setEditDetails] = useState({
    coupleName: weddingDetails?.coupleName || "",
    weddingDate: weddingDetails?.weddingDate || "",
    weddingLocation: weddingDetails?.weddingLocation || "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const coupleName = weddingDetails?.coupleName || "Your Wedding";
  const weddingDate = weddingDetails?.weddingDate || new Date().toISOString();
  const weddingLocation = weddingDetails?.weddingLocation || "Location TBD";

  const completedTasksCount = useMemo(
    () => checklistItems?.filter((item) => item.completed).length || 0,
    [checklistItems]
  );
  const totalVendorsCount = vendors?.length || 0;
  const totalSpent = useMemo(
    () =>
      budgetItems?.reduce((sum, item) => sum + item.spent, 0) || 0,
    [budgetItems]
  );
  const totalBudget = weddingDetails?.totalBudget || budgetItems.reduce((sum, item) => sum + item.estimated, 0);
  const budgetPercentage = useMemo(
    () => Math.min(100, totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0),
    [totalSpent, totalBudget]
  );
  const daysLeft = useMemo(
    () =>
      Math.max(
        0,
        Math.ceil(
          (new Date(weddingDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      ),
    [weddingDate]
  );

  // Load data on mount and focus
  const loadData = useCallback(async () => {
    if (user?.id) {
      await initialize(user.id);
    }
  }, [user?.id, initialize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={() => setMenuModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={8}
        >
          <Menu size={22} color={Colors.light.background} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const openEditModal = () => {
    setEditDetails({
      coupleName: weddingDetails?.coupleName || "",
      weddingDate: normalizeDateValue(weddingDetails?.weddingDate),
      weddingLocation: weddingDetails?.weddingLocation || "",
    });
    setEditError(null);
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    if (!user?.id) {
      useToastStore.getState().showToast(
        "Please log in to update your profile image",
        "error"
      );
      return;
    }

    try {
      setImageLoading(true);
      const result = await pickAndUploadProfileImage(user.id);

      if (result.success && result.imageUrl) {
        setProfileImage(result.imageUrl);
        const storeResult = await updateProfileImage(result.imageUrl);

        if (storeResult.success) {
          // Refresh the auth user so the new picture survives an app restart
          await useAuthStore.getState().refreshUser();
          useToastStore.getState().showToast(
            "Profile picture updated successfully!",
            "success"
          );
        } else {
          useToastStore.getState().showToast(
            "Image selected but not saved to profile",
            "warning"
          );
        }
      } else {
        useToastStore.getState().showToast(
          result.error || "Failed to select image",
          "error"
        );
      }
    } catch (error) {
      if (__DEV__) console.error("Image upload error:", error);
      useToastStore.getState().showToast(
        "An unexpected error occurred",
        "error"
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleEditDetails = async () => {
    if (!editDetails.coupleName.trim()) {
      setEditError("Enter the couple's names.");
      return;
    }

    const dateValue = editDetails.weddingDate.trim();
    if (dateValue) {
      const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
      const parsed = validFormat ? new Date(`${dateValue}T00:00:00`) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) {
        setEditError("Enter the wedding date as YYYY-MM-DD.");
        return;
      }
    }

    setEditError(null);
    setSaving(true);
    const result = await setWeddingDetails({
      ...editDetails,
      coupleName: editDetails.coupleName.trim(),
      weddingLocation: editDetails.weddingLocation.trim(),
      totalBudget: weddingDetails?.totalBudget || 0,
    });
    setSaving(false);
    if (result.success) {
      setEditModalVisible(false);
      useToastStore
        .getState()
        .showToast("Wedding details updated!", "success");
    } else {
      setEditError(result.error || "Could not save your changes. Try again.");
    }
  };

  const handleMenuAction = async (id: string) => {
    setMenuModalVisible(false);
    if (id === "bookings") router.push("/bookings" as unknown as Href);
    else if (id === "settings") router.push("/settings");
    else if (id === "notifications") router.push("/notifications");
    else if (id === "help") router.push("/help");
    else if (id === "vendor-dashboard") router.push("/vendor-dashboard");
    else if (id === "logout") {
      setTimeout(() => {
        Alert.alert(
          "Log Out",
          "Log out of ShaadiBazaar? Your saved planning data stays in your account.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log Out",
              style: "destructive",
              onPress: async () => {
                await logout();
                trackEvent(AnalyticsEvents.SIGN_OUT);
                router.replace("/auth/login");
              },
            },
          ]
        );
      }, 300);
    }
  };

  const handleFavoritesPress = useCallback(() => {
    hapticSelection();
    if (favoriteVendors.length > 0) {
      router.push("/favorites");
    } else {
      router.push("/(tabs)/vendors");
    }
  }, [favoriteVendors.length, router]);

  // Check if user owns any vendor
  const ownedVendor = vendors.find((v) => v.userId === user?.id);

  const MENU_ITEMS = useMemo(() => {
    const items = [
      {
        id: "bookings",
        title: "My Bookings",
        icon: Calendar,
        color: Colors.light.text,
      },
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
        color: Colors.light.text,
      },
      {
        id: "notifications",
        title: "Notifications",
        icon: Bell,
        color: Colors.light.text,
      },
      {
        id: "help",
        title: "Help & Support",
        icon: HelpCircle,
        color: Colors.light.text,
      },
      {
        id: "logout",
        title: "Log Out",
        icon: LogOut,
        color: Colors.light.error,
      },
    ];

    // Add Vendor Dashboard for vendor owners
    if (ownedVendor) {
      items.unshift({
        id: "vendor-dashboard",
        title: "Vendor Dashboard",
        icon: LayoutDashboard,
        color: Colors.light.primary,
      });
    }

    return items;
  }, [ownedVendor]);

  const QUICK_ACTIONS = useMemo(
    () => [
      {
        id: "checklist",
        title: "Checklist",
        subtitle: `${completedTasksCount}/${checklistItems.length} done`,
        icon: ListChecks,
        color: Colors.light.accentIndigo,
        onPress: () => router.push("/(tabs)/checklist"),
      },
      {
        id: "budget",
        title: "Budget",
        subtitle: `${budgetPercentage}% spent`,
        icon: IndianRupee,
        color: Colors.light.accentEmerald,
        onPress: () => router.push("/budget"),
      },
      {
        id: "favorites",
        title: "Favorites",
        subtitle: `${favoriteVendors.length} vendors`,
        icon: Heart,
        color: Colors.light.accentRed,
        onPress: handleFavoritesPress,
      },
      {
        id: "messages",
        title: "Messages",
        subtitle: "Chat with vendors",
        icon: MessageCircle,
        color: Colors.light.accentAmber,
        onPress: () => router.push("/(tabs)/messages"),
      },
    ],
    [completedTasksCount, checklistItems.length, budgetPercentage, favoriteVendors.length, handleFavoritesPress, router]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage as ImageStyle}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={handlePickImage}
                  disabled={imageLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile picture"
                  hitSlop={12}
                >
                  <Camera size={12} color={Colors.light.background} />
                </TouchableOpacity>
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>{coupleName}</Text>
                <View style={styles.heroInfoRow}>
                  <Calendar size={12} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                  <Text style={styles.heroInfoText}>
                    {new Date(weddingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.heroInfoRow}>
                  <MapPin size={12} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                  <Text style={styles.heroInfoText}>{weddingLocation}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.heroEditButton}
              onPress={openEditModal}
              accessibilityRole="button"
              accessibilityLabel="Edit wedding details"
            >
              <Text style={styles.heroEditText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{daysLeft}</Text>
              <Text style={styles.heroStatLabel}>Days Left</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{completedTasksCount}</Text>
              <Text style={styles.heroStatLabel}>Tasks Done</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalVendorsCount}</Text>
              <Text style={styles.heroStatLabel}>Vendors</Text>
            </View>
          </View>

          {/* Budget Progress Bar */}
          <View style={styles.heroBudgetContainer}>
            <View style={styles.heroBudgetRow}>
              <Text style={styles.heroBudgetLabel}>Budget</Text>
              <Text style={styles.heroBudgetValue}>
                ₹{(totalSpent / 100000).toFixed(1)}L / ₹{(totalBudget / 100000).toFixed(1)}L
              </Text>
            </View>
            <View style={styles.heroProgressBar}>
              <View
                style={[
                  styles.heroProgressFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(0, budgetPercentage)
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActionsContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={action.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={action.title}
              >
                <View
                  style={[
                    styles.quickActionIconContainer,
                    { backgroundColor: action.color + "15" },
                  ]}
                >
                  <action.icon size={22} color={action.color} strokeWidth={1.5} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Favorite Vendors Section */}
        <Card variant="elevated" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={handleFavoritesPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View favorite vendors"
          >
            <View style={styles.sectionHeaderLeft}>
              <Heart size={18} color={Colors.light.error} fill={Colors.light.error} />
              <Text style={styles.sectionTitle}>
                Favorite Vendors {favoriteVendors.length > 0 ? `(${favoriteVendors.length})` : ""}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.light.textLight} strokeWidth={1.5} />
          </TouchableOpacity>

          {favoriteVendors.length > 0 ? (
            <View style={styles.favoriteChips}>
              {vendors
                .filter((v) => favoriteVendors.includes(v.id))
                .slice(0, 5)
                .map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={styles.favoriteChip}
                    onPress={() =>
                      router.push({
                        pathname: "/vendor/[id]",
                        params: { id: vendor.id },
                      })
                    }
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View favorite vendor ${vendor.name}`}
                  >
                    <Image
                      source={{ uri: vendor.coverImage }}
                      style={styles.favoriteChipImage as ImageStyle}
                    />
                    <View style={styles.favoriteChipTextContainer}>
                      <Text style={styles.favoriteChipName} numberOfLines={1}>
                        {vendor.name}
                      </Text>
                      <View style={styles.favoriteChipRating}>
                        <Star size={10} color={Colors.light.secondary} fill={Colors.light.secondary} />
                        <Text style={styles.favoriteChipRatingText}>{vendor.rating}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              {favoriteVendors.length > 5 && (
                <TouchableOpacity
                  style={[styles.favoriteChip, styles.favoriteChipMore]}
                  onPress={() => router.push("/favorites")}
                >
                  <Text style={styles.favoriteChipMoreText}>
                    +{favoriteVendors.length - 5} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyFavorites}>
              <Heart size={32} color={Colors.light.textLight} />
              <Text style={styles.emptyFavoritesText}>No favorites yet</Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)/vendors")}
              >
                <Text style={styles.browseButtonText}>Browse Vendors</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Menu Items */}
        <Card variant="elevated" style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuAction(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={20} color={item.color} strokeWidth={1.5} />
                <Text
                  style={[
                    styles.menuItemText,
                    item.id === "logout" && styles.menuItemLogoutText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              <ChevronRight
                size={16}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ))}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ShaadiBazaar v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Wedding Details Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} accessibilityViewIsModal>
            <Text style={styles.modalTitle}>Edit Wedding Details</Text>

            <Text style={styles.fieldLabel}>Couple names</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Aarav & Priya"
              value={editDetails.coupleName}
              onChangeText={(text) => {
                setEditDetails((d) => ({ ...d, coupleName: text }));
                if (editError) setEditError(null);
              }}
              placeholderTextColor={Colors.light.textLight}
              autoComplete="name"
              textContentType="name"
              accessibilityLabel="Couple names"
            />

            <Text style={styles.fieldLabel}>Wedding date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={editDetails.weddingDate}
              onChangeText={(text) => {
                setEditDetails((d) => ({ ...d, weddingDate: text }));
                if (editError) setEditError(null);
              }}
              placeholderTextColor={Colors.light.textLight}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accessibilityLabel="Wedding date in YYYY-MM-DD format"
            />

            <Text style={styles.fieldLabel}>Wedding location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Jaipur, Rajasthan"
              value={editDetails.weddingLocation}
              onChangeText={(text) => {
                setEditDetails((d) => ({ ...d, weddingLocation: text }));
                if (editError) setEditError(null);
              }}
              placeholderTextColor={Colors.light.textLight}
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              accessibilityLabel="Wedding location"
            />

            {editError ? (
              <Text
                style={styles.editError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {editError}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditError(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSaveButton,
                  saving && styles.modalButtonDisabled,
                ]}
                onPress={handleEditDetails}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save wedding details"
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                <Text style={styles.modalSaveText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={menuModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View style={styles.menuModalContent}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuModalItem,
                  index === MENU_ITEMS.length - 1 && styles.menuModalItemLast,
                ]}
                onPress={() => handleMenuAction(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.menuModalItemLeft}>
                  <item.icon size={20} color={item.color} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.menuModalItemText,
                      item.id === "logout" && styles.menuModalLogoutText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <ChevronRight
                  size={16}
                  color={Colors.light.textLight}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  headerMenuButton: {
    marginRight: 16,
    padding: 4,
  },

  // Hero Section (compact, dark blue)
  heroSection: {
    backgroundColor: Colors.light.headerBackground,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  heroLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.headerBackground,
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
    marginBottom: 4,
  },
  heroInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  heroInfoText: {
    fontSize: 11,
    fontWeight: "500" as FontWeight,
    color: "rgba(255,255,255,0.75)",
  },
  heroEditButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEditText: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },

  // Hero stats row
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
    marginBottom: 1,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: "500" as FontWeight,
    color: "rgba(255,255,255,0.65)",
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Budget progress in hero
  heroBudgetContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 10,
  },
  heroBudgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  heroBudgetLabel: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: "rgba(255,255,255,0.8)",
  },
  heroBudgetValue: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  heroProgressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: Colors.light.success,
    borderRadius: 2,
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionItem: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 64,
    maxWidth: 120,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 9,
    fontWeight: "500" as FontWeight,
    color: Colors.light.textLight,
  },

  // Section Cards
  sectionCard: {
    margin: 12,
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },

  // Favorite Chips
  favoriteChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  favoriteChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 20,
    paddingVertical: 6,
    paddingRight: 12,
    paddingLeft: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  favoriteChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  favoriteChipTextContainer: {
    maxWidth: 100,
  },
  favoriteChipName: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  favoriteChipRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  favoriteChipRatingText: {
    fontSize: 10,
    color: Colors.light.textLight,
  },
  favoriteChipMore: {
    backgroundColor: Colors.light.primary + "10",
    borderColor: Colors.light.primary,
    paddingHorizontal: 12,
  },
  favoriteChipMoreText: {
    fontSize: 11,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
  },

  // Empty favorites
  emptyFavorites: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyFavoritesText: {
    fontSize: 13,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  browseButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  browseButtonText: {
    fontSize: 12,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },

  // Menu Card
  menuCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: Colors.light.background,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemFirst: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
  },
  menuItemLogoutText: {
    color: Colors.light.error,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 10,
    padding: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 12,
    minHeight: 48,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
    marginBottom: 6,
  },
  editError: {
    fontSize: 14,
    color: Colors.light.error,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: Colors.light.backgroundAlt,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  modalSaveButton: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },

  // Menu Modal
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  menuModalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuModalItemLast: {
    borderBottomWidth: 0,
  },
  menuModalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuModalItemText: {
    fontSize: 14,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
  },
  menuModalLogoutText: {
    color: Colors.light.error,
  },
});
