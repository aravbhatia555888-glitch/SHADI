import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthScreenContainer from "@/components/auth/AuthScreenContainer";
import AuthTextInput from "@/components/auth/AuthTextInput";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { Radius, Spacing } from "@/constants/layout";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { Apple,Lock,Mail } from "lucide-react-native";
import { useState } from "react";
import {
ActivityIndicator,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const {
    signIn,
    loginWithGoogle,
    loginWithApple,
    loading,
    error,
    clearError,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      const result = await signIn({ email: email.trim(), password });

      if (result.success) {
        router.replace("/");
      }
    } catch (err) {
      if (__DEV__) console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    const result = await loginWithGoogle();
    if (result.success) {
      router.replace("/");
    } else if (result.error) {
      useToastStore.getState().showToast(result.error, "error");
    }
    setSocialLoading(null);
  };

  const handleAppleLogin = async () => {
    setSocialLoading("apple");
    const result = await loginWithApple();
    if (result.success) {
      router.replace("/");
    } else if (result.error) {
      useToastStore.getState().showToast(result.error, "error");
    }
    setSocialLoading(null);
  };

  return (
    <AuthScreenContainer>
      <AuthHeader
        logo
        title="Welcome Back!"
        subtitle="Sign in to continue planning your perfect wedding"
      />

      <AuthTextInput
        label="Email"
        leftAccessory={<Mail size={20} color={Colors.light.textLight} />}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (validationErrors.email) {
            setValidationErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        accessibilityLabel="Email"
        error={validationErrors.email}
      />

      <View style={styles.spaced}>
        <PasswordInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (validationErrors.password) {
              setValidationErrors((prev) => ({
                ...prev,
                password: undefined,
              }));
            }
          }}
          placeholder="Enter your password"
          leftAccessory={<Lock size={20} color={Colors.light.textLight} />}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          accessibilityLabel="Password"
          error={validationErrors.password}
        />
      </View>

      <TouchableOpacity
        style={styles.forgotRow}
        onPress={() => router.push("/auth/forgot-password")}
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

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
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        size="large"
        fullWidth
        style={styles.primaryButton}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={[
            styles.socialButton,
            socialLoading !== null &&
              socialLoading !== "google" &&
              styles.socialButtonDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={socialLoading !== null}
          accessibilityLabel="Sign in with Google"
          accessibilityRole="button"
          accessibilityState={{
            busy: socialLoading === "google",
            disabled: socialLoading !== null,
          }}
        >
          {socialLoading === "google" ? (
            <ActivityIndicator size="small" color={Colors.light.text} />
          ) : (
            <View style={styles.socialButtonContent}>
              <Text style={styles.googleGlyph}>G</Text>
              <Text style={styles.socialButtonLabel}>Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {Platform.OS === "ios" ? (
          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.appleButton,
              socialLoading !== null &&
                socialLoading !== "apple" &&
                styles.socialButtonDisabled,
            ]}
            onPress={handleAppleLogin}
            disabled={socialLoading !== null}
            accessibilityLabel="Sign in with Apple"
            accessibilityRole="button"
            accessibilityState={{
              busy: socialLoading === "apple",
              disabled: socialLoading !== null,
            }}
          >
            {socialLoading === "apple" ? (
              <ActivityIndicator size="small" color={Colors.light.white} />
            ) : (
              <View style={styles.socialButtonContent}>
                <Apple size={20} color={Colors.light.white} />
                <Text style={[styles.socialButtonLabel, styles.appleButtonText]}>
                  Apple
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <AuthFooter>
        <Text style={styles.signupText}>Don&apos;t have an account? </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          accessibilityRole="button"
          accessibilityLabel="Sign up"
        >
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  spaced: {
    marginTop: Spacing.xl,
  },
  forgotRow: {
    alignSelf: "flex-end",
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  forgotText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: Spacing.xxl,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginHorizontal: Spacing.lg,
  },
  socialButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.4,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.white,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  appleButton: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  googleGlyph: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  socialButtonLabel: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  appleButtonText: {
    color: Colors.light.white,
  },
  signupText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  signupLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
});
