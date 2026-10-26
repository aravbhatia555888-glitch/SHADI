import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import {
RatingDistribution,
Review,
ReviewInput,
Vendor,
} from "@/schemas/wedding";
import { MessageSquare } from "lucide-react-native";
import React,{ useCallback,useEffect,useState } from "react";
import {
ActivityIndicator,
RefreshControl,
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";
import Button from "./Button";
import ReviewFormModal from "./ReviewFormModal";
import ReviewItem from "./ReviewItem";
import ReviewSummary from "./ReviewSummary";

export interface ReviewsTabProps {
  vendor: Vendor;
  userId?: string;
  onLoadReviews: (vendorId: string) => Promise<Review[]>;
  onSubmitReview: (review: ReviewInput) => Promise<void>;
  onUpdateReview: (reviewId: string, review: ReviewInput) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onVoteHelpful: (reviewId: string, helpful: boolean) => Promise<void>;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({
  vendor,
  userId,
  onLoadReviews,
  onSubmitReview,
  onUpdateReview,
  onDeleteReview,
  onVoteHelpful,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ratingDistribution: RatingDistribution = React.useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0, average: 0 };

    if (reviews.length === 0) return distribution;

    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    distribution.total = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    distribution.average = totalRating / reviews.length;

    return distribution;
  }, [reviews]);

  const userReview = userId
    ? reviews.find((review) => review.userId === userId)
    : null;

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const vendorReviews = await onLoadReviews(vendor.id);
      setReviews(vendorReviews);
    } catch (_error) {
      setLoadError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onLoadReviews, vendor.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setLoadError(null);
      await loadReviews();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitReview = async (reviewData: ReviewInput) => {
    try {
      setSubmitting(true);

      if (editingReview) {
        await onUpdateReview(editingReview.id, reviewData);
      } else {
        await onSubmitReview(reviewData);
      }

      await loadReviews();
      setShowReviewForm(false);
      setEditingReview(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await onDeleteReview(reviewId);
      await loadReviews();
    } catch (_error) {
      setLoadError("Failed to delete review. Please try again.");
    }
  };

  const handleVoteHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await onVoteHelpful(reviewId, helpful);
      await loadReviews();
    } catch (_error) {
      setLoadError("Failed to register your vote. Please try again.");
    }
  };

  const handleWriteReview = () => {
    setEditingReview(null);
    setShowReviewForm(true);
  };

  const handleCloseForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity
              onPress={loadReviews}
              accessibilityLabel="Retry loading reviews"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ReviewSummary
          averageRating={ratingDistribution.average}
          totalReviews={ratingDistribution.total}
          ratingDistribution={ratingDistribution}
        />

        {userId && (
          <View style={styles.writeReviewSection}>
            {userReview ? (
              <View style={styles.userReviewNotice}>
                <Text style={styles.userReviewText}>
                  You've already reviewed this vendor. You can edit or delete
                  your review below.
                </Text>
              </View>
            ) : (
              <Button
                title="Write a Review"
                onPress={handleWriteReview}
                style={styles.writeReviewButton}
              />
            )}
          </View>
        )}

        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsListTitle}>
              All Reviews ({reviews.length})
            </Text>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                isUserReview={review.userId === userId}
                onEdit={() => handleEditReview(review)}
                onDelete={() => handleDeleteReview(review.id)}
                onHelpful={(helpful) => handleVoteHelpful(review.id, helpful)}
                userVote={null}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MessageSquare
              size={64}
              color={Colors.light.textLight}
              strokeWidth={1.5}
            />
            <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to share your experience with this vendor!
            </Text>
            {userId && (
              <Button
                title="Write First Review"
                onPress={handleWriteReview}
                style={styles.firstReviewButton}
              />
            )}
          </View>
        )}
      </ScrollView>

      <ReviewFormModal
        visible={showReviewForm}
        vendor={vendor}
        existingReview={editingReview || undefined}
        onClose={handleCloseForm}
        onSubmit={handleSubmitReview}
        loading={submitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginTop: 16,
  },
  errorBanner: {
    backgroundColor: Colors.light.error + "15",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    flex: 1,
  },
  retryText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.semiBold,
    marginLeft: 12,
  },
  writeReviewSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  writeReviewButton: {
    marginBottom: 8,
  },
  userReviewNotice: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  userReviewText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },
  reviewsList: {
    paddingHorizontal: 16,
  },
  reviewsListTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  firstReviewButton: {
    paddingHorizontal: 32,
    backgroundColor: Colors.light.primary,
  },
});

export default ReviewsTab;
