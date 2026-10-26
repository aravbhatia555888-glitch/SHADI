import Colors from "@/constants/colors";
import { Star } from "lucide-react-native";
import React from "react";
import { StyleSheet,TouchableOpacity,View } from "react-native";

export interface StarRatingProps {
  rating: number;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  maxStars?: number;
  fillColor?: string;
  emptyColor?: string;
  allowHalfStars?: boolean;
  testID?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = "medium",
  interactive = false,
  onRatingChange,
  maxStars = 5,
  fillColor = Colors.light.secondary,
  emptyColor = Colors.light.background,
  allowHalfStars = true,
  testID,
}) => {
  const starSizes = {
    small: 12,
    medium: 16,
    large: 24,
  };

  const starSize = starSizes[size];
  const touchableSize = Math.max(starSize + 8, 32);

  const handleStarPress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      const newRating = starIndex + 1;
      if (rating === newRating) {
        onRatingChange(0);
      } else {
        onRatingChange(newRating);
      }
    }
  };

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const isFullStar = rating >= starValue;
    const isHalfStar =
      allowHalfStars && rating >= starValue - 0.5 && rating < starValue;

    const starBorderColor = Colors.light.secondary;
    let resolvedColor = emptyColor;

    if (isFullStar) {
      resolvedColor = fillColor;
    } else if (isHalfStar) {
      resolvedColor = fillColor;
    }

    if (interactive) {
      return (
        <TouchableOpacity
          key={starIndex}
          onPress={() => handleStarPress(starIndex)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${starValue} star${
            starValue > 1 ? "s" : ""
          }`}
          style={[
            styles.starTouchable,
            {
              width: touchableSize,
              height: touchableSize,
            },
          ]}
        >
          <View style={styles.starWrapper}>
            <Star
              size={starSize}
              color={starBorderColor}
              fill={resolvedColor}
              fillOpacity={isHalfStar ? 0.5 : 1}
              strokeWidth={1.5}
            />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View key={starIndex} style={styles.starContainer}>
        <View style={styles.starWrapper}>
          <Star
            size={starSize}
            color={starBorderColor}
            fill={resolvedColor}
            fillOpacity={isHalfStar ? 0.5 : 1}
            strokeWidth={1.5}
          />
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, interactive && styles.interactiveContainer]}
      testID={testID}
      accessibilityRole={interactive ? "adjustable" : "text"}
      accessibilityLabel={
        interactive
          ? `Rating input, current rating ${rating} out of ${maxStars} stars`
          : `Rating ${rating} out of ${maxStars} stars`
      }
      accessibilityValue={
        interactive
          ? {
              min: 0,
              max: maxStars,
              now: rating,
            }
          : undefined
      }
    >
      {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  interactiveContainer: {
    paddingVertical: 4,
  },
  starContainer: {
    marginRight: 2,
  },
  starTouchable: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  starWrapper: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default StarRating;
