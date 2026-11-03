import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Typography from "@/constants/typography";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import {
AlertCircle,
Bell,
Calendar,
CheckCircle,
ChevronLeft,
} from "lucide-react-native";
import { useState } from "react";
import {
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

const NOTIFICATIONS = [
  {
    id: "1",
    type: "success",
    title: "Vendor Booking Confirmed",
    message:
      "Royal Palace Banquet has confirmed your booking for June 15, 2024",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "reminder",
    title: "Task Reminder",
    message: "Don't forget to book your photographer. Only 45 days left!",
    time: "1 day ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Budget Update",
    message: "You've spent 65% of your total budget",
    time: "2 days ago",
    read: true,
  },
  {
    id: "4",
    type: "success",
    title: "Task Completed",
    message: "Great job! You completed 'Book wedding venue'",
    time: "3 days ago",
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color={Colors.light.success} />;
      case "reminder":
        return <Calendar size={20} color={Colors.light.primary} />;
      case "info":
        return <AlertCircle size={20} color={Colors.light.textLight} />;
      default:
        return <Bell size={20} color={Colors.light.textLight} />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => markRead(notification.id)}
            style={[
              styles.notificationItem,
              !notification.read && styles.unreadNotification,
            ]}
          >
            <View style={styles.iconContainer}>
              {getIcon(notification.type)}
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.headerBackground,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  markAllRead: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.white,
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  unreadNotification: {
    backgroundColor: Colors.light.backgroundAlt,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
  },
});
