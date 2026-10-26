import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { RatingDistribution } from "@/schemas/wedding";
import React from "react";
import { StyleSheet,Text,View } from "react-native";
import Card from "./Card";
import StarRating from "./StarRating";

export interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  testID?: string;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  testID,
}) => {
  const getRatingPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const formattedRating = averageRating.toFixed(1);

  const renderRatingBar = (starCount: number, count: number) => {
    const percentage = getRatingPercentage(count);

    return (
      <View key={starCount} style={styles.ratingBarRow}>
        <Text style={styles.starLabel}>{starCount}</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${percentage}%` }]}
            />
          </View>
        </View>
        <Text style={styles.countLabel}>{count}</Text>
      </View>
    );
  };

  return (
    <Card variant="elevated" style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.overallRating}>
          <Text style={styles.ratingNumber}>{formattedRating}</Text>
          <View style={styles.starsContainer}>
            <StarRating rating={averageRating} size="medium" />
          </View>
          <Text style={styles.totalReviews}>
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </Text>
        </View>

        <View style={styles.distribution}>
          <Text style={styles.distributionTitle}>Rating Breakdown</Text>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((starCount) =>
              renderRatingBar(
                starCount,
                ratingDistribution[
                  starCount as keyof RatingDistribution
                ] as number
              )
            )}
          </View>
        </View>
      </View>
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
    gap: 24,
  },
  overallRating: {
    alignItems: "center",
    minWidth: 120,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.text,
    marginBottom: 4,
  },
  starsContainer: {
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  distribution: {
    flex: 1,
  },
  distributionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 12,
  },
  ratingBars: {
    gap: 8,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    width: 12,
    textAlign: "right",
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.secondary,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    width: 24,
    textAlign: "right",
  },
});

export default ReviewSummary;
