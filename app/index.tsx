import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import { isOnboardingComplete } from "@/utils/onboarding";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { user, loading, isInitialized } = useAuthStore();
  const [timedOut, setTimedOut] = useState(false);
  // The user id the onboarding check has completed for. Comparing against the
  // current user id means we never route on a stale result after sign-in.
  const [checkedFor, setCheckedFor] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setTimedOut(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized || !user) return;
    let cancelled = false;
    isOnboardingComplete(user.id).then((done) => {
      if (cancelled) return;
      setNeedsOnboarding(!done);
      setCheckedFor(user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [isInitialized, user]);

  const ready = isInitialized && (!user || checkedFor === user.id);

  if (loading || !ready) {
    if (timedOut && !isInitialized) {
      // Don't hang on a stuck session restore.
      return <Redirect href="/auth/login" />;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.light.textLight,
  },
});
