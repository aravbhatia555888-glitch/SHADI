import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import { Redirect } from "expo-router";
import { useEffect,useState } from "react";
import { ActivityIndicator,StyleSheet,Text,View } from "react-native";

export default function Index() {
  const { user, loading, isInitialized } = useAuthStore();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setTimedOut(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [isInitialized]);

  if (loading || !isInitialized) {
    if (timedOut) {
      // Show a fallback UI instead of hanging on loading
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
