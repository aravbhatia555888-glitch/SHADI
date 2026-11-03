import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthScreenContainer from "@/components/auth/AuthScreenContainer";
import AuthTextInput from "@/components/auth/AuthTextInput";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { Spacing } from "@/constants/layout";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import { Check,Mail,User } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <AuthScreenContainer>
      <AuthHeader
        align="left"
        title="Create Account"
        subtitle="Join us to plan your dream wedding"
      />

      <AuthTextInput
        label="Full name"
        leftAccessory={<User size={20} color={Colors.light.textLight} />}
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (validationErrors.name) {
            setValidationErrors((prev) => ({ ...prev, name: undefined }));
          }
        }}
        placeholder="Enter your full name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        accessibilityLabel="Full name"
        error={validationErrors.name}
      />

      <View style={styles.spaced}>
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
      </View>

      <View style={styles.spaced}>
        <PasswordInput
          label="Password"
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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          accessibilityLabel="Password"
          error={validationErrors.password}
        />
      </View>

      <View style={styles.spaced}>
        <PasswordInput
          label="Confirm password"
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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSignup}
          accessibilityLabel="Confirm password"
          error={validationErrors.confirmPassword}
        />
      </View>

      <TouchableOpacity
        style={styles.termsRow}
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
        <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
          {acceptTerms ? (
            <Check size={14} color={Colors.light.background} strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.termsText}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>
      {validationErrors.terms ? (
        <Text
          style={styles.fieldError}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {validationErrors.terms}
        </Text>
      ) : null}

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
        title="Create Account"
        onPress={handleSignup}
        loading={loading}
        size="large"
        fullWidth
        style={styles.primaryButton}
      />

      <AuthFooter>
        <Text style={styles.signinText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.signinLink}>Sign In</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  spaced: {
    marginTop: Spacing.xl,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 44,
    marginTop: Spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundAlt,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  fieldError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: Spacing.xs,
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
  signinText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  signinLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
});
