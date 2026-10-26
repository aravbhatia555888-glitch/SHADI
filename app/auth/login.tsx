import Button from "@/components/Button";
import Icon from "@/components/Icon";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { Eye,EyeOff,Lock,Mail } from "lucide-react-native";
import { useState } from "react";
import {
Dimensions,
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

const { width } = Dimensions.get("window");

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
  const [showPassword, setShowPassword] = useState(false);
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
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      if (__DEV__) console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    const result = await loginWithGoogle();
    if (result.success) {
      router.replace("/(tabs)/home");
    } else if (result.error) {
      useToastStore.getState().showToast(result.error, "error");
    }
    setSocialLoading(null);
  };

  const handleAppleLogin = async () => {
    setSocialLoading("apple");
    const result = await loginWithApple();
    if (result.success) {
      router.replace("/(tabs)/home");
    } else if (result.error) {
      useToastStore.getState().showToast(result.error, "error");
    }
    setSocialLoading(null);
  };

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
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>ShaadiBazaar</Text>
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue planning your perfect wedding
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Icon
                icon={Mail}
                size={20}
                color={Colors.light.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }
                }}
                placeholder="Enter your email"
                placeholderTextColor={Colors.light.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessibilityLabel="Email input"
              />
            </View>
            {validationErrors.email && (
              <Text style={styles.validationError}>
                {validationErrors.email}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Icon
                icon={Lock}
                size={20}
                color={Colors.light.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
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
                placeholderTextColor={Colors.light.textLight}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Icon
                  icon={showPassword ? EyeOff : Eye}
                  size={20}
                  color={Colors.light.textLight}
                />
              </TouchableOpacity>
            </View>
            {validationErrors.password && (
              <Text style={styles.validationError}>
                {validationErrors.password}
              </Text>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/auth/forgot-password")}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            size="large"
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={socialLoading !== null}
              accessibilityLabel="Sign in with Google"
              accessibilityRole="button"
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>G</Text>
                <Text style={styles.socialButtonLabel}>Google</Text>
              </View>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleLogin}
                disabled={socialLoading !== null}
                accessibilityLabel="Sign in with Apple"
                accessibilityRole="button"
              >
                <View style={styles.socialButtonContent}>
                  <Text
                    style={[styles.socialButtonText, styles.appleButtonText]}
                  >
                    🍎
                  </Text>
                  <Text
                    style={[styles.socialButtonLabel, styles.appleButtonText]}
                  >
                    Apple
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/signup")}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: width * 0.2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "500" as FontWeight,
    color: Colors.light.textLight,
    textAlign: "center",
    maxWidth: "80%",
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  passwordInput: {
    flex: 1,
  },
  showPasswordButton: {
    padding: 8,
    marginLeft: 8,
  },
  errorText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    textAlign: "center",
  },
  validationError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500" as FontWeight,
    color: Colors.light.primary,
    textAlign: "right",
    marginTop: -16,
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.white,
  },
  appleButton: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  socialButtonText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700",
  },
  socialButtonLabel: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
  },
  appleButtonText: {
    color: Colors.light.white,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signupText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  signupLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "600" as const,
  },
});
