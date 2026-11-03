import { supabase } from "@/config/supabase";
import Colors from "@/constants/colors";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type * as NotificationsType from "expo-notifications";

const NOTIFICATION_ROUTES = [
  "/(tabs)/messages",
  "/(tabs)/checklist",
  "/budget",
] as const;

export type NotificationRoute = (typeof NOTIFICATION_ROUTES)[number];

export function getNotificationRoute(
  data: Record<string, unknown> | undefined
): NotificationRoute | null {
  const screen = data?.screen;
  return typeof screen === "string" &&
    (NOTIFICATION_ROUTES as readonly string[]).includes(screen)
    ? (screen as NotificationRoute)
    : null;
}

type NotificationsModule = typeof import("expo-notifications");

// expo-notifications' native modules are not available in Expo Go (remote push
// is unsupported since SDK 53), and importing it throws. Load it lazily so the
// app still runs in Expo Go; every function degrades to a safe no-op there.
let notificationsPromise: Promise<NotificationsModule | null> | null = null;

function loadNotifications(): Promise<NotificationsModule | null> {
  // Expo Go cannot load the notifications native modules at all.
  if (Constants.executionEnvironment === "storeClient") {
    return Promise.resolve(null);
  }
  if (!notificationsPromise) {
    notificationsPromise = import("expo-notifications")
      .then((mod) => {
        try {
          mod.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } catch {
          // ignore — handler setup is optional
        }
        return mod;
      })
      .catch(() => null);
  }
  return notificationsPromise;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  if (!Device.isDevice) {
    if (__DEV__) console.warn("Push notifications require a physical device");
    return null;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "ShaadiBazaar",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.light.primary,
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      if (__DEV__) console.warn("Push notification permission not granted");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    return tokenData.data;
  } catch (error) {
    if (__DEV__) console.warn("Push registration unavailable:", error);
    return null;
  }
}

export async function savePushToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    if (__DEV__) console.warn("Error saving push token:", error);
    return false;
  }
}

export async function removePushToken(userId: string): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    const { error } = await supabase
      .from("user_push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", tokenData.data);
    if (error) throw error;
    return true;
  } catch (error) {
    if (__DEV__) console.warn("Error removing push token:", error);
    return false;
  }
}

export function addNotificationReceivedListener(
  handler: (notification: NotificationsType.Notification) => void
): { remove: () => void } {
  let sub: NotificationsType.Subscription | null = null;
  let cancelled = false;

  loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    if (typeof Notifications.addNotificationReceivedListener !== "function") return;
    sub = Notifications.addNotificationReceivedListener(handler);
  });

  return {
    remove() {
      cancelled = true;
      sub?.remove();
      sub = null;
    },
  };
}

export function addNotificationResponseListener(
  handler: (response: NotificationsType.NotificationResponse) => void
): { remove: () => void } {
  let sub: NotificationsType.Subscription | null = null;
  let cancelled = false;

  loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    if (typeof Notifications.addNotificationResponseReceivedListener !== "function") return;
    sub = Notifications.addNotificationResponseReceivedListener(handler);
  });

  return {
    remove() {
      cancelled = true;
      sub?.remove();
      sub = null;
    },
  };
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds?: number
): Promise<string> {
  const Notifications = await loadNotifications();
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== "function") {
    return "";
  }

  return await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: seconds
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        }
      : null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  const Notifications = await loadNotifications();
  if (!Notifications) return 0;
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}

export async function sendBookingConfirmationNotification(
  vendorName: string
): Promise<void> {
  await scheduleLocalNotification(
    "Booking Request Sent!",
    `Your booking request has been sent to ${vendorName}. They will contact you shortly.`,
    { screen: "/(tabs)/messages" },
    2
  );
}

export async function sendTaskReminderNotification(
  taskTitle: string,
  daysLeft: number
): Promise<void> {
  await scheduleLocalNotification(
    "Task Reminder",
    `Don't forget: "${taskTitle}" is due in ${daysLeft} days!`,
    { screen: "/(tabs)/checklist" }
  );
}

export async function sendBudgetAlertNotification(
  category: string,
  percentage: number
): Promise<void> {
  await scheduleLocalNotification(
    "Budget Alert",
    `You've spent ${percentage}% of your ${category} budget.`,
    { screen: "/budget" }
  );
}
