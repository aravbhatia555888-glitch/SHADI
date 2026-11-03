import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthScreenContainer from "@/components/auth/AuthScreenContainer";
import AuthTextInput from "@/components/auth/AuthTextInput";
import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { Spacing } from "@/constants/layout";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet,Text,TouchableOpacity } from "react-native";

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
    } catch (err) {
      if (__DEV__) console.error("Reset password error:", err);
    }
  };

  if (success) {
    return (
      <AuthScreenContainer center>
        <AuthHeader
          title="Check Your Email"
          subtitle="We've sent password reset instructions to your email address. Please check your inbox."
        />
        <Button
          title="Back to Login"
          onPress={() => router.replace("/auth/login")}
          size="large"
          fullWidth
        />
      </AuthScreenContainer>
    );
  }

  return (
    <AuthScreenContainer>
      <AuthHeader
        align="left"
        title="Reset Password"
        subtitle="Enter your email address and we'll send you instructions to reset your password."
      />

      <AuthTextInput
        label="Email"
        leftAccessory={<Mail size={20} color={Colors.light.textLight} />}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (validationError) setValidationError(null);
        }}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleResetPassword}
        accessibilityLabel="Email"
        error={validationError}
      />

      {error ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      <Button
        title="Send Reset Link"
        onPress={handleResetPassword}
        loading={loading}
        size="large"
        fullWidth
        style={styles.primaryButton}
      />

      <AuthFooter>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/auth/login")}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
  },
  primaryButton: {
    marginTop: Spacing.xxl,
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
});
