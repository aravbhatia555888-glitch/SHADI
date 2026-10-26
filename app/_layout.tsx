import ErrorBoundary from "@/components/ErrorBoundary";
import IconWrapper from "@/components/IconWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ToastContainer } from "@/components/ToastContainer";
import Colors from "@/constants/colors";
import { configureAnalytics } from "@/services/analytics";
import { createAutoAnalyticsProvider } from "@/services/analytics-firebase";
import {
addNotificationReceivedListener,
addNotificationResponseListener,
getNotificationRoute,
registerForPushNotifications,
savePushToken,
} from "@/services/notifications";
import { initSentry } from "@/services/sentry";
import { useAuthStore } from "@/stores/auth-store";
import { useWeddingStore } from "@/stores/wedding-store";
import * as Notifications from "expo-notifications";
import { Stack,router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useEffect,useRef } from "react";
import { Platform,StyleSheet,TouchableOpacity,View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

initSentry();

export default function RootLayout() {
  const { initialize, user, isInitialized: authInitialized } = useAuthStore();
  const {
    initialize: initializeWedding,
    loadVendors,
    resetPersonalData,
  } = useWeddingStore();
  const insets = useSafeAreaInsets();
  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);
  const responseListener =
    useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Auto-detect if a real analytics provider is configured (e.g. Firebase)
    const analyticsProvider = createAutoAnalyticsProvider();
    configureAnalytics(analyticsProvider);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
        await loadVendors();
      } catch (error) {
        if (__DEV__) console.error("App initialization error:", error);
      }
    };

    initializeApp();
  }, [initialize, loadVendors]);

  useEffect(() => {
    if (!authInitialized) return;
    if (user?.id) {
      initializeWedding(user.id);
    } else {
      resetPersonalData();
    }
  }, [authInitialized, initializeWedding, resetPersonalData, user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      const registeringUserId = user.id;
      registerForPushNotifications().then((token) => {
        if (!cancelled && token) {
          savePushToken(registeringUserId, token);
        }
      });
    }

    notificationListener.current = addNotificationReceivedListener(
      (_notification) => {
        // Notification received — analytics tracking handled via analytics service
      }
    );

    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      const route = getNotificationRoute(data);
      if (route) {
        router.push(route);
      }
    });

    return () => {
      cancelled = true;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary screenName="app-root">
      <ProtectedRoute>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
        ]}
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: true,
            headerLeft: Platform.OS === "ios" ? undefined : () => null,
            animation: "slide_from_right",
            headerStyle: {
              backgroundColor: Colors.light.headerBackground,
            },
            headerTitleStyle: {
              color: Colors.light.background,
            },
            headerTintColor: Colors.light.background,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              animation: "none",
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animation: "none",
            }}
          />
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="vendor"
            options={{
              animation: "slide_from_right",
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <IconWrapper
                    icon={ChevronLeft}
                    size={24}
                    color={Colors.light.background}
                  />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="favorites"
            options={{
              title: "My Favorites",
              animation: "slide_from_right",
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <IconWrapper
                    icon={ChevronLeft}
                    size={24}
                    color={Colors.light.background}
                  />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="inspiration"
            options={{
              title: "Wedding Inspiration",
              animation: "slide_from_right",
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <IconWrapper
                    icon={ChevronLeft}
                    size={24}
                    color={Colors.light.background}
                  />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="booking"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="compare-vendors"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="ai-planner"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="wedding-cards"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="card-designer"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="vendor-dashboard"
            options={{
              title: "Vendor Dashboard",
              animation: "slide_from_right",
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <IconWrapper
                    icon={ChevronLeft}
                    size={24}
                    color={Colors.light.background}
                  />
                </TouchableOpacity>
              ),
            }}
          />
        </Stack>
        <ToastContainer />
      </View>
      </ProtectedRoute>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    marginLeft: 8,
  },
});
