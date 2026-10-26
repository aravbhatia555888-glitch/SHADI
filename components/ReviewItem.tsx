import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Review } from "@/schemas/wedding";
import {
Edit,
MoreHorizontal,
ThumbsDown,
ThumbsUp,
Trash2,
} from "lucide-react-native";
import React,{ useState } from "react";
import { Alert,StyleSheet,Text,TouchableOpacity,View } from "react-native";
import Card from "./Card";
import Icon from "./Icon";
import StarRating from "./StarRating";

export interface ReviewItemProps {
  review: Review;
  isUserReview: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHelpful?: (helpful: boolean) => void;
  userVote?: boolean | null;
  testID?: string;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  isUserReview,
  onEdit,
  onDelete,
  onHelpful,
  userVote,
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const maxLength = 150;
  const needsTruncation = review.content.length > maxLength;
  const displayContent =
    needsTruncation && !isExpanded
      ? review.content.substring(0, maxLength) + "..."
      : review.content;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getUserInitials = () => {
    if (review.userInitials) return review.userInitials;
    return "AN";
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  const handleHelpfulVote = (helpful: boolean) => {
    if (onHelpful) {
      onHelpful(helpful);
    }
  };

  return (
    <Card variant="elevated" style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.ratingRow}>
              <StarRating rating={review.rating} size="small" />
              <Text style={styles.dateText}>
                {formatDate(review.createdAt)}
                {review.edited && (
                  <Text style={styles.editedText}> • edited</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {isUserReview && (
          <TouchableOpacity
            onPress={() => setShowActions(!showActions)}
            style={styles.moreButton}
            accessibilityLabel="Review options"
          >
            <MoreHorizontal
              size={20}
              color={Colors.light.textLight}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        )}
      </View>

      {isUserReview && showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setShowActions(false);
              onEdit?.();
            }}
            accessibilityLabel="Edit review"
          >
            <Edit size={16} color={Colors.light.primary} strokeWidth={1.5} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setShowActions(false);
              handleDelete();
            }}
            accessibilityLabel="Delete review"
          >
            <Icon icon={Trash2} size={16} color={Colors.light.error} />
            <Text style={[styles.actionText, { color: Colors.light.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {review.title && <Text style={styles.title}>{review.title}</Text>}
        <Text style={styles.reviewText}>{displayContent}</Text>

        {needsTruncation && (
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.readMoreButton}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? "Read less" : "Read more"}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? "Read Less" : "Read More"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!isUserReview && onHelpful && (
        <View style={styles.helpfulSection}>
          <Text style={styles.helpfulLabel}>Was this helpful?</Text>
          <View style={styles.helpfulButtons}>
            <TouchableOpacity
              style={[
                styles.helpfulButton,
                userVote === true && styles.helpfulButtonActive,
              ]}
              onPress={() => handleHelpfulVote(true)}
              accessibilityLabel="Mark as helpful"
            >
              <Icon
                icon={ThumbsUp}
                size={16}
                color={
                  userVote === true
                    ? Colors.light.success
                    : Colors.light.textLight
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.helpfulButton,
                userVote === false && styles.helpfulButtonActive,
              ]}
              onPress={() => handleHelpfulVote(false)}
              accessibilityLabel="Mark as not helpful"
            >
              <Icon
                icon={ThumbsDown}
                size={16}
                color={
                  userVote === false
                    ? Colors.light.error
                    : Colors.light.textLight
                }
              />
            </TouchableOpacity>
          </View>
          {review.helpful > 0 && (
            <Text style={styles.helpfulCount}>
              {review.helpful} found this helpful
            </Text>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.background,
  },
  userDetails: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginLeft: 8,
  },
  editedText: {
    fontStyle: "italic",
  },
  moreButton: {
    padding: 4,
  },
  actionsMenu: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 6,
  },
  readMoreText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  helpfulSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  helpfulLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  helpfulButtons: {
    flexDirection: "row",
    gap: 8,
  },
  helpfulButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundAlt,
  },
  helpfulButtonActive: {
    backgroundColor: Colors.light.primary + "20",
  },
  helpfulCount: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginLeft: "auto",
  },
});

export default ReviewItem;
