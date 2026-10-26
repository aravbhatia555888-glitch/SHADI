import { supabase } from "@/config/supabase";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.warn("Push notifications require a physical device");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ShaadiBazaar",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#800000",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
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
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds?: number
): Promise<string> {
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
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
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
