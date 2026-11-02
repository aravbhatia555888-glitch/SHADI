import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setValidationError("Enter the email address for your account.");
      return;
    }
    setValidationError(null);

    try {
      const result = await resetPassword({ email: email.trim() });

      if (result.success) {
        setSuccess(true);
      }
      // Error handling is done by the store
    } catch (error) {
      if (__DEV__) console.error("Reset password error:", error);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.message}>
            We've sent password reset instructions to your email address. Please
            check your inbox.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => router.push("/auth/login")}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset
            your password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationError) setValidationError(null);
              }}
              placeholder="Enter your email"
              placeholderTextColor={Colors.light.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={handleResetPassword}
              accessibilityLabel="Email"
            />
            {validationError && (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationError}
              </Text>
            )}
          </View>

          {error && (
            <Text
              style={styles.errorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          )}

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/auth/login")}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500",
    color: Colors.light.text,
  },
  input: {
    height: 48,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 16,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    textAlign: "center",
  },
  fieldError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    marginVertical: 16,
  },
});
