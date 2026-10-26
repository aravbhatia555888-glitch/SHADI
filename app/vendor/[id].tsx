import Button from "@/components/Button";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import RequestQuoteModal,{ QuoteRequest } from "@/components/RequestQuoteModal";
import ReviewsTab from "@/components/ReviewsTab";
import { supabase } from "@/config/supabase";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import type { Review,ReviewInput } from "@/schemas/wedding";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useInquiryStore } from "@/stores/inquiry-store";
import { useReviewStore } from "@/stores/review-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { hapticMedium } from "@/utils/haptics";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
Check,
ChevronLeft,
ChevronRight,
FileText,
Heart,
MapPin,
MessageCircle,
Share2,
Star,
} from "lucide-react-native";
import { useEffect,useState } from "react";
import {
Image,
ScrollView,
Share,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { vendors, favoriteVendors, toggleFavoriteVendor, loadVendors } =
    useWeddingStore();
  const { user } = useAuthStore();
  const {
    loadVendorReviews,
    addVendorReview,
    updateVendorReview,
    deleteVendorReview,
  } = useReviewStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState("about");
  const [localIsFavorite, setLocalIsFavorite] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const vendor = vendors.find((v) => v.id === id);

  useEffect(() => {
    if (vendors.length === 0) {
      loadVendors();
    }
  }, [loadVendors, vendors.length]);

  useEffect(() => {
    if (vendor) {
      trackEvent(AnalyticsEvents.VENDOR_VIEW, {
        vendorId: vendor.id,
        vendorName: vendor.name,
      });
    }
  }, [vendor]);

  useEffect(() => {
    const isFav = favoriteVendors.includes(vendor?.id || "");
    setLocalIsFavorite(isFav);
  }, [favoriteVendors, vendor?.id]);

  useEffect(() => {
    if (vendor?.id) {
      loadVendorReviews(vendor.id);
    }
  }, [loadVendorReviews, vendor?.id]);

  if (!vendor) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Vendor not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
        />
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${vendor.name} on ShaadiBazaar! ${vendor.description}`,
        url: `https://shaadibazaar.com/vendor/${vendor.id}`,
      });
    } catch (_err) {
      useToastStore
        .getState()
        .showToast("Unable to share at this time", "error");
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < vendor.gallery.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setCurrentImageIndex(0);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else {
      setCurrentImageIndex(vendor.gallery.length - 1);
    }
  };

  const handleBookNow = () => {
    // Route through the full booking form (package selection, date, payment)
    // instead of jumping straight to a confirmation screen.
    router.push({
      pathname: "/booking/[vendorId]",
      params: { vendorId: vendor.id },
    });
  };

  const handleMessage = async () => {
    if (!user?.id) {
      useToastStore
        .getState()
        .showToast("Please log in to message a vendor", "error");
      return;
    }
    const result = await useChatStore
      .getState()
      .startConversation(user.id, vendor.id);
    if (result.success && result.conversationId) {
      router.push(`/chat/${result.conversationId}`);
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Could not start conversation", "error");
    }
  };

  const handleLoadReviews = async (vendorId: string): Promise<Review[]> => {
    await loadVendorReviews(vendorId);
    const { reviews } = useReviewStore.getState();
    return reviews.map((r) => ({
      id: r.id,
      vendorId: r.vendorId,
      userId: r.userId,
      rating: r.rating,
      content: r.comment,
      helpful: 0,
      edited: false,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? r.createdAt,
      userInitials: r.userName
        ? r.userName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : undefined,
    }));
  };

  const handleSubmitReview = async (review: ReviewInput) => {
    if (!user?.id) {
      useToastStore
        .getState()
        .showToast("You must be logged in to submit a review", "error");
      return;
    }
    const result = await addVendorReview({
      vendorId: review.vendorId,
      userId: user.id,
      userName: user.name || "Anonymous",
      rating: review.rating,
      comment: review.content,
    });
    if (result.success) {
      await loadVendorReviews(vendor.id);
      trackEvent(AnalyticsEvents.REVIEW_SUBMIT, { vendorId: review.vendorId });
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Failed to submit review", "error");
    }
  };

  const handleUpdateReview = async (reviewId: string, review: ReviewInput) => {
    const result = await updateVendorReview(reviewId, {
      rating: review.rating,
      comment: review.content,
    });
    if (result.success) {
      await loadVendorReviews(vendor.id);
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Failed to update review", "error");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const result = await deleteVendorReview(reviewId);
    if (result.success) {
      await loadVendorReviews(vendor.id);
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Failed to delete review", "error");
    }
  };

  const handleVoteHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        useToastStore
          .getState()
          .showToast(
            "Sign in to mark reviews as helpful",
            "error"
          );
        return;
      }
      const { error } = await supabase
        .from("review_votes")
        .upsert(
          {
            review_id: reviewId,
            user_id: user.id,
            helpful,
            created_at: new Date().toISOString(),
          },
          { onConflict: "review_id,user_id" }
        );
      if (error) {
        useToastStore
          .getState()
          .showToast("Couldn't save your vote", "error");
        return;
      }
      useToastStore.getState().showToast(
        helpful ? "Marked as helpful" : "Vote removed",
        "success"
      );
    } catch {
      useToastStore.getState().showToast("Something went wrong", "error");
    }
  };

  const handleSubmitQuote = async (quoteData: QuoteRequest) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) {
      useToastStore.getState().showToast(
        "Please log in to send a quote request",
        "error"
      );
      throw new Error("Not authenticated");
    }

    const { sendInquiry } = useInquiryStore.getState();
    const result = await sendInquiry({
      vendorId: quoteData.vendorId,
      userName: quoteData.userName,
      userEmail: quoteData.userEmail,
      userPhone: quoteData.userPhone,
      subject: `Quote Request for ${vendor.name}`,
      message:
        quoteData.message ||
        `Wedding Date: ${quoteData.weddingDate}, Guests: ${quoteData.guestCount}, Budget: ${quoteData.budgetRange}`,
      eventDate: quoteData.weddingDate
        ? new Date(quoteData.weddingDate).toISOString()
        : undefined,
      eventType: "Wedding",
      budget: quoteData.budgetRange
        ? parseInt(quoteData.budgetRange.replace(/[^0-9]/g, "")) || undefined
        : undefined,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send quote request");
    }

    trackEvent(AnalyticsEvents.VENDOR_CONTACT, {
      vendorId: quoteData.vendorId,
      budgetRange: quoteData.budgetRange,
    });
    setShowQuoteModal(false);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "about":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.description}>{vendor.description}</Text>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Features</Text>
              {vendor.features.map((feature, idx) => (
                <View
                  key={typeof feature === "string" ? idx : feature.id}
                  style={styles.featureItem}
                >
                  <Text style={styles.featureTitle}>
                    {typeof feature === "string" ? feature : feature.title}
                  </Text>
                  {typeof feature !== "string" && feature.description && (
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Services</Text>
              {vendor.services.map((service, idx) => (
                <View
                  key={typeof service === "string" ? idx : service.id}
                  style={styles.serviceItem}
                >
                  <Text style={styles.serviceTitle}>
                    • {typeof service === "string" ? service : service.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      case "packages":
        return (
          <View style={styles.tabContent}>
            {vendor.packages.map((pkg, idx) => (
              <Card key={pkg.id ?? idx} style={styles.packageCard}>
                <Text style={styles.packageTitle}>
                  {pkg.title ?? pkg.name ?? ""}
                </Text>
                <Text style={styles.packagePrice}>
                  {String(pkg.price ?? "")}
                </Text>
                <View style={styles.packageFeatures}>
                  {(pkg.features ?? pkg.items ?? []).map((feature, index) => (
                    <View key={index} style={styles.packageFeatureItem}>
                      <Text style={styles.packageFeatureText}>
                        • {feature}
                      </Text>
                    </View>
                  ))}
                </View>
                <Button
                  title="Select Package"
                  onPress={handleBookNow}
                  variant="outline"
                />
              </Card>
            ))}
          </View>
        );
      case "reviews":
        return (
          <ReviewsTab
            vendor={vendor}
            userId={user?.id}
            onLoadReviews={handleLoadReviews}
            onSubmitReview={handleSubmitReview}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={handleDeleteReview}
            onVoteHelpful={handleVoteHelpful}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: vendor.name,
          headerStyle: {
            backgroundColor: Colors.light.headerBackground,
          },
          headerTitleStyle: {
            color: Colors.light.background,
          },
          headerTintColor: Colors.light.background,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.push("/(tabs)/vendors")
              }
              style={{ marginLeft: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon
                icon={ChevronLeft}
                size={24}
                color={Colors.light.background}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={[styles.headerButtons, { marginRight: 16 }]}>
              <TouchableOpacity
                onPress={async () => {
                  const newState = !localIsFavorite;
                  setLocalIsFavorite(newState);
                  hapticMedium();
                  try {
                    const result = await toggleFavoriteVendor(vendor.id);
                    if (result.success) {
                      useToastStore
                        .getState()
                        .showToast(
                          newState
                            ? "Added to favorites"
                            : "Removed from favorites",
                          "success"
                        );
                    } else {
                      setLocalIsFavorite(!newState);
                      useToastStore
                        .getState()
                        .showToast("Could not save favorite", "error");
                    }
                  } catch (_err) {
                    setLocalIsFavorite(!newState);
                    useToastStore
                      .getState()
                      .showToast("Something went wrong", "error");
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  localIsFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Heart
                  size={24}
                  color={
                    localIsFavorite
                      ? Colors.light.error
                      : Colors.light.background
                  }
                  fill={localIsFavorite ? Colors.light.error : "none"}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Share vendor"
              >
                <Icon
                  icon={Share2}
                  size={24}
                  color={Colors.light.background}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: vendor.gallery[currentImageIndex] }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>
              {currentImageIndex + 1}/{vendor.gallery.length}
            </Text>
          </View>

          {vendor.verified && (
            <View style={styles.verifiedBadge}>
              <Icon icon={Check} size={14} color={Colors.light.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {vendor.gallery.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.prevButton]}
                onPress={handlePrevImage}
                accessibilityRole="button"
                accessibilityLabel="Previous photo"
              >
                <Icon
                  icon={ChevronLeft}
                  size={24}
                  color={Colors.light.background}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.nextButton]}
                onPress={handleNextImage}
                accessibilityRole="button"
                accessibilityLabel="Next photo"
              >
                <Icon
                  icon={ChevronRight}
                  size={24}
                  color={Colors.light.background}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.pullHandle} />

          <View style={styles.header}>
            <View style={styles.ratingContainer}>
              <Star
                size={16}
                color={Colors.light.secondary}
                fill={Colors.light.secondary}
                strokeWidth={1.5}
              />
              <Text style={styles.rating}>{vendor.rating}</Text>
              <Text style={styles.reviewCount}>
                ({vendor.reviewCount} reviews)
              </Text>
            </View>
            <View style={styles.locationContainer}>
              <MapPin
                size={16}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
              <Text style={styles.location}>
                {typeof vendor.location === "object"
                  ? `${vendor.location.city}, ${vendor.location.state}`
                  : vendor.location}
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => setShowQuoteModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Request a quote"
            >
              <FileText
                size={20}
                color={Colors.light.background}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.primaryActionButtonText,
                ]}
              >
                Request Quote
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMessage}
              accessibilityRole="button"
              accessibilityLabel="Send a message"
            >
              <MessageCircle
                size={20}
                color={Colors.light.primary}
                strokeWidth={2}
              />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "about" && styles.activeTab]}
              onPress={() => setSelectedTab("about")}
              accessibilityRole="tab"
              accessibilityLabel="About tab"
              accessibilityState={{ selected: selectedTab === "about" }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "about" && styles.activeTabText,
                ]}
              >
                About
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === "packages" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("packages")}
              accessibilityRole="tab"
              accessibilityLabel="Packages tab"
              accessibilityState={{ selected: selectedTab === "packages" }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "packages" && styles.activeTabText,
                ]}
              >
                Packages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === "reviews" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("reviews")}
              accessibilityRole="tab"
              accessibilityLabel="Reviews tab"
              accessibilityState={{ selected: selectedTab === "reviews" }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "reviews" && styles.activeTabText,
                ]}
              >
                Reviews ({vendor.reviewCount})
              </Text>
            </TouchableOpacity>
          </View>

          {renderTabContent()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>{vendor.priceRange}</Text>
        </View>
        <Button
          title="Book Now"
          onPress={handleBookNow}
          style={styles.bookButton}
        />
      </View>

      <RequestQuoteModal
        visible={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        vendorName={vendor.name}
        vendorId={vendor.id}
        onSubmit={handleSubmitQuote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerButtons: { flexDirection: "row", alignItems: "center" },
  headerButton: { marginLeft: 16 },
  imageContainer: { position: "relative", height: 425 },
  image: { width: "100%", height: "100%" },
  imageNavButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: { left: 16 },
  nextButton: { right: 16 },
  photoCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCounterText: {
    color: Colors.light.background,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
  },
  verifiedBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedText: {
    color: Colors.light.success,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600" as FontWeight,
  },
  content: {
    marginTop: -30,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pullHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: { marginBottom: 16 },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  locationContainer: { flexDirection: "row", alignItems: "center" },
  location: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryActionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  primaryActionButtonText: {
    color: Colors.light.background,
    fontWeight: "600" as FontWeight,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.light.primary },
  tabText: { fontSize: Typography.fontSizes.md, color: Colors.light.textLight },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  tabContent: { paddingTop: 16 },
  description: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 16,
  },
  featureItem: { marginBottom: 16 },
  featureTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  serviceItem: { marginBottom: 8 },
  serviceTitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  packageCard: { marginBottom: 16 },
  packageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 16,
  },
  packageFeatures: { marginBottom: 16 },
  packageFeatureItem: { marginBottom: 6 },
  packageFeatureText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  priceContainer: { flex: 1 },
  priceLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  price: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
  },
  bookButton: { flex: 1, marginLeft: 16 },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  notFoundText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 16,
  },
});
