import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Review,ReviewInput,Vendor } from "@/schemas/wedding";
import { useToastStore } from "@/stores/toast-store";
import { X } from "lucide-react-native";
import React,{ useEffect,useState } from "react";
import {
Alert,
KeyboardAvoidingView,
Modal,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";
import Button from "./Button";
import Icon from "./Icon";
import StarRating from "./StarRating";

export interface ReviewFormModalProps {
  visible: boolean;
  vendor: Vendor;
  existingReview?: Review;
  onClose: () => void;
  onSubmit: (review: ReviewInput) => Promise<void>;
  loading?: boolean;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  visible,
  vendor,
  existingReview,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existingReview;
  const maxContentLength = 500;
  const maxTitleLength = 100;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || "");
      setContent(existingReview.content);
    } else {
      setRating(0);
      setTitle("");
      setContent("");
    }
    setErrors({});
  }, [existingReview, visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (content.trim().length < 10) {
      newErrors.content = "Review must be at least 10 characters";
    }

    if (content.length > maxContentLength) {
      newErrors.content = `Review must be ${maxContentLength} characters or less`;
    }

    if (title.length > maxTitleLength) {
      newErrors.title = `Title must be ${maxTitleLength} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const reviewData: ReviewInput = {
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        vendorId: vendor.id,
      };

      await onSubmit(reviewData);
      onClose();
    } catch (_error) {
      useToastStore.getState().showToast("Failed to submit review. Please try again.", "error");
    }
  };

  const handleClose = () => {
    if (rating > 0 || content.trim() || title.trim()) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Review" : "Write Review"}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
          >
            <Icon icon={X} size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.vendorCategory}>{vendor.category}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Rating <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                size="large"
                interactive
                onRatingChange={setRating}
              />
              <Text style={styles.ratingText}>
                {rating > 0
                  ? `${rating} star${rating > 1 ? "s" : ""}`
                  : "Tap to rate"}
              </Text>
            </View>
            {errors.rating && (
              <Text style={styles.errorText}>{errors.rating}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title (Optional)</Text>
            <TextInput
              style={[
                styles.titleInput,
                errors.title ? styles.inputError : null,
              ]}
              placeholder="Brief summary of your experience"
              value={title}
              onChangeText={setTitle}
              maxLength={maxTitleLength}
              placeholderTextColor={Colors.light.textLight}
            />
            <View style={styles.inputFooter}>
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              <Text style={styles.characterCount}>
                {title.length}/{maxTitleLength}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Review <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                errors.content ? styles.inputError : null,
              ]}
              placeholder="Share your experience with this vendor..."
              value={content}
              onChangeText={setContent}
              maxLength={maxContentLength}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={Colors.light.textLight}
            />
            <View style={styles.inputFooter}>
              {errors.content && (
                <Text style={styles.errorText}>{errors.content}</Text>
              )}
              <Text style={styles.characterCount}>
                {content.length}/{maxContentLength}
              </Text>
            </View>
          </View>

          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and constructive in your feedback{"\n"}• Focus on your
              experience with the vendor{"\n"}• Avoid personal attacks or
              inappropriate language{"\n"}• Include specific details that might
              help other couples
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleClose}
            style={styles.cancelButton}
            disabled={loading}
          />
          <Button
            title={isEditing ? "Update Review" : "Submit Review"}
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading || rating === 0 || content.trim().length < 10}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  vendorInfo: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 24,
  },
  vendorName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 12,
  },
  required: {
    color: Colors.light.error,
  },
  ratingContainer: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    marginVertical: 8,
  },
  ratingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginTop: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
    minHeight: 120,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
  },
  characterCount: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  guidelines: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default ReviewFormModal;
