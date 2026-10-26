import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useToastStore } from "@/stores/toast-store";
import { Calendar,MessageSquare,Users,X } from "lucide-react-native";
import { useState } from "react";
import {
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

interface RequestQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  vendorName: string;
  vendorId: string;
  onSubmit: (quoteData: QuoteRequest) => Promise<void>;
}

export interface QuoteRequest {
  vendorId: string;
  weddingDate: string;
  guestCount: string;
  budgetRange: string;
  message: string;
  userEmail: string;
  userPhone: string;
  userName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+()-]{7,15}$/;

export default function RequestQuoteModal({
  visible,
  onClose,
  vendorName,
  vendorId,
  onSubmit,
}: RequestQuoteModalProps) {
  const [formData, setFormData] = useState<QuoteRequest>({
    vendorId,
    weddingDate: "",
    guestCount: "",
    budgetRange: "",
    message: "",
    userEmail: "",
    userPhone: "",
    userName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const budgetRanges = [
    "Under ₹1,00,000",
    "₹1,00,000 - ₹2,50,000",
    "₹2,50,000 - ₹5,00,000",
    "₹5,00,000 - ₹10,00,000",
    "₹10,00,000+",
    "Not sure yet",
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userName.trim()) {
      newErrors.userName = "Please enter your name";
    }
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = "Please enter your email";
    } else if (!EMAIL_REGEX.test(formData.userEmail.trim())) {
      newErrors.userEmail = "Please enter a valid email address";
    }
    if (
      formData.userPhone.trim() &&
      !PHONE_REGEX.test(formData.userPhone.trim())
    ) {
      newErrors.userPhone = "Please enter a valid phone number";
    }
    if (!formData.weddingDate.trim()) {
      newErrors.weddingDate = "Please enter your wedding date";
    }
    if (!formData.budgetRange) {
      newErrors.budgetRange = "Please select a budget range";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      useToastStore.getState().showToast(
        `Your inquiry has been sent to ${vendorName}. They will respond within 24-48 hours.`,
        "success",
        4000
      );
      handleClose();
    } catch (_error) {
      useToastStore.getState().showToast("Failed to send quote request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendorId,
      weddingDate: "",
      guestCount: "",
      budgetRange: "",
      message: "",
      userEmail: "",
      userPhone: "",
      userName: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Quote</Text>
                <Text style={styles.modalSubtitle}>from {vendorName}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                accessibilityLabel="Close"
              >
                <X size={24} color={Colors.light.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Your contact info will be shared with the vendor so they can
                  respond to your inquiry.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Your Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.userName ? styles.inputError : null,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.light.textLight}
                  value={formData.userName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, userName: text });
                    if (errors.userName) setErrors({ ...errors, userName: "" });
                  }}
                />
                {errors.userName ? (
                  <Text style={styles.errorText}>{errors.userName}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.userEmail ? styles.inputError : null,
                  ]}
                  placeholder="your.email@example.com"
                  placeholderTextColor={Colors.light.textLight}
                  value={formData.userEmail}
                  onChangeText={(text) => {
                    setFormData({ ...formData, userEmail: text });
                    if (errors.userEmail)
                      setErrors({ ...errors, userEmail: "" });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.userEmail ? (
                  <Text style={styles.errorText}>{errors.userEmail}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.userPhone ? styles.inputError : null,
                  ]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.light.textLight}
                  value={formData.userPhone}
                  onChangeText={(text) => {
                    setFormData({ ...formData, userPhone: text });
                    if (errors.userPhone)
                      setErrors({ ...errors, userPhone: "" });
                  }}
                  keyboardType="phone-pad"
                />
                {errors.userPhone ? (
                  <Text style={styles.errorText}>{errors.userPhone}</Text>
                ) : null}
              </View>

              <Text style={styles.sectionTitle}>Wedding Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wedding Date *</Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    errors.weddingDate ? styles.inputError : null,
                  ]}
                >
                  <Calendar
                    size={20}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="MM/DD/YYYY or 'Not set yet'"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.weddingDate}
                    onChangeText={(text) => {
                      setFormData({ ...formData, weddingDate: text });
                      if (errors.weddingDate)
                        setErrors({ ...errors, weddingDate: "" });
                    }}
                  />
                </View>
                {errors.weddingDate ? (
                  <Text style={styles.errorText}>{errors.weddingDate}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Guest Count (Optional)</Text>
                <View style={styles.inputWithIcon}>
                  <Users
                    size={20}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="Approximate number of guests"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.guestCount}
                    onChangeText={(text) =>
                      setFormData({ ...formData, guestCount: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget Range *</Text>
                <View style={styles.budgetOptions}>
                  {budgetRanges.map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.budgetOption,
                        formData.budgetRange === range &&
                          styles.budgetOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, budgetRange: range });
                        if (errors.budgetRange)
                          setErrors({ ...errors, budgetRange: "" });
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected: formData.budgetRange === range,
                      }}
                    >
                      <Text
                        style={[
                          styles.budgetOptionText,
                          formData.budgetRange === range &&
                            styles.budgetOptionTextSelected,
                        ]}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.budgetRange ? (
                  <Text style={styles.errorText}>{errors.budgetRange}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message (Optional)</Text>
                <View style={styles.inputWithIcon}>
                  <MessageSquare
                    size={20}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                  <TextInput
                    style={[styles.inputWithIconText, styles.textArea]}
                    placeholder="Tell the vendor about your wedding vision, specific requirements, or questions..."
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.message}
                    onChangeText={(text) =>
                      setFormData({ ...formData, message: text })
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.bottomSpacing} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={loading ? "Sending..." : "Send Quote Request"}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.submitButton}
              />
              <TouchableOpacity
                onPress={handleClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.shadow,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    elevation: 5,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  infoBanner: {
    backgroundColor: Colors.light.primary + "15",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 8,
  },
  budgetOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  budgetOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  budgetOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  budgetOptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: Typography.fontWeights.medium,
  },
  budgetOptionTextSelected: {
    color: Colors.light.background,
    fontWeight: Typography.fontWeights.semiBold,
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    fontWeight: Typography.fontWeights.medium,
  },
});
