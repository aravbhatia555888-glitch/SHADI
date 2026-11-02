import Button from "@/components/Button";
import Icon from "@/components/Icon";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { Check,Eye,EyeOff } from "lucide-react-native";
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

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      errors.name = "Please enter your name";
    }
    if (!email.trim()) {
      errors.email = "Please enter your email";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Please enter a password";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!acceptTerms) {
      errors.terms = "You must accept the terms of service";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      const result = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        confirmPassword,
      });

      if (result.success) {
        router.replace("/");
      }
    } catch (err) {
      if (__DEV__) console.error("Signup error:", err);
    }
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join us to plan your dream wedding
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (validationErrors.name) {
                  setValidationErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.light.textLight}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              accessibilityLabel="Full name"
            />
            {validationErrors.name && (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationErrors.name}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
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
              textContentType="emailAddress"
              returnKeyType="next"
              accessibilityLabel="Email"
            />
            {validationErrors.email && (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationErrors.email}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
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
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                accessibilityLabel="Password"
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
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationErrors.password}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.light.textLight}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                accessibilityLabel="Confirm password"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                <Icon
                  icon={showConfirmPassword ? EyeOff : Eye}
                  size={20}
                  color={Colors.light.textLight}
                />
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {validationErrors.confirmPassword}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => {
              setAcceptTerms(!acceptTerms);
              if (validationErrors.terms) {
                setValidationErrors((prev) => ({ ...prev, terms: undefined }));
              }
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptTerms }}
            accessibilityLabel="Accept terms of service"
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkedBox]}>
              {acceptTerms && (
                <Icon icon={Check} size={14} color={Colors.light.background} />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          {validationErrors.terms && (
            <Text
              style={styles.fieldError}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {validationErrors.terms}
            </Text>
          )}

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
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.loginLink}>Sign In</Text>
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
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "500" as FontWeight,
    color: Colors.light.textLight,
    marginBottom: 24,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  showPasswordButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundAlt,
  },
  checkedBox: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  errorText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    textAlign: "center",
  },
  fieldError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: 2,
  },
  button: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  loginLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
  },
});
