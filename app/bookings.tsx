import Card from "@/components/Card";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import { useBookingStore } from "@/stores/booking-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { VendorBooking } from "@/schemas/wedding";
import { format } from "date-fns";
import { Stack, useRouter } from "expo-router";
import { Calendar, XCircle } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { bookings, loading, loadUserBookings, cancelBooking } = useBookingStore();
  const { vendors } = useWeddingStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserBookings(user.id);
    }
  }, [user?.id, loadUserBookings]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadUserBookings(user.id);
    setRefreshing(false);
  }, [user?.id, loadUserBookings]);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? If you have paid an advance, our support team will assist with the refund process.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            const result = await cancelBooking(bookingId);
            if (!result.success) {
              Alert.alert("Error", result.error || "Failed to cancel booking.");
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: VendorBooking["status"]) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmed", bg: "#ECFDF5", text: "#059669" };
      case "pending":
        return { label: "Pending", bg: "#FFFBEB", text: "#D97706" };
      case "completed":
        return { label: "Completed", bg: "#EFF6FF", text: "#2563EB" };
      case "cancelled":
        return { label: "Cancelled", bg: "#FEF2F2", text: "#DC2626" };
      default:
        return { label: status, bg: "#F3F4F6", text: "#4B5563" };
    }
  };

  const renderBookingItem = ({ item }: { item: VendorBooking }) => {
    const vendor = vendors.find((v) => v.id === item.vendorId);
    const vendorName = vendor?.name || item.contactName || "Wedding Vendor";
    const statusBadge = getStatusBadge(item.status);
    const formattedDate = item.eventDate
      ? format(new Date(item.eventDate), "EEE, d MMM yyyy")
      : "Date not set";

    return (
      <Card variant="elevated" style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendorName}
            </Text>
            <Text style={styles.eventType}>{item.eventType}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
            <Text style={[styles.badgeText, { color: statusBadge.text }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Calendar size={16} color={Colors.light.textLight} />
          <Text style={styles.detailsText}>{formattedDate}</Text>
        </View>

        <View style={styles.pricingRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>₹{item.totalAmount.toLocaleString("en-IN")}</Text>
          </View>
          {item.advanceAmount ? (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Advance Paid</Text>
              <Text style={[styles.priceValue, { color: "#059669" }]}>
                ₹{item.advanceAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Payment Status</Text>
            <Text style={[styles.priceValue, { textTransform: "capitalize" }]}>
              {item.paymentStatus}
            </Text>
          </View>
        </View>

        {item.status === "pending" ? (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item.id)}
            >
              <XCircle size={16} color={Colors.light.error} />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Bookings",
          headerBackTitle: "Back",
          headerTintColor: Colors.light.primary,
        }}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {loading && !refreshing && bookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Calendar size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't booked any wedding vendors yet. Explore our top-rated vendors and reserve your dates!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(tabs)/vendors")}
            >
              <Text style={styles.browseButtonText}>Browse Vendors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBookingItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.light.primary]}
              />
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  eventType: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  priceItem: {
    alignItems: "flex-start",
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    color: Colors.light.error,
    fontWeight: "500",
  },
});
