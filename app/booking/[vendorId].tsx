import Button from "@/components/Button";
import PaymentScreen from "@/components/PaymentScreen";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useBookingStore } from "@/stores/booking-store";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
Calendar,
Check,
ChevronLeft,
MessageSquare,
Package,
Users,
} from "lucide-react-native";
import { useState } from "react";
import {
ActivityIndicator,
SafeAreaView,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View
} from "react-native";

// The advance percentage is enforced server-side (25% of the package price by
// the set_authoritative_booking_price trigger), so the UI must match it.
const STANDARD_ADVANCE_PERCENT = 25;

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { vendorId, packageId } = useLocalSearchParams();
  const { vendors, loading, error, loadVendors } = useWeddingStore();
  const { user } = useAuthStore();
  const { createBooking, checkVendorAvailability } = useBookingStore();

  const vendor = vendors.find((v) => v.id === vendorId);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    typeof packageId === "string" ? packageId : null
  );
  const [guestCount, setGuestCount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentOption, setPaymentOption] = useState<"full" | "advance">(
    "advance"
  );
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  if (!vendor) {
    return (
      <View style={styles.notFoundContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : (
          <>
            <Text style={styles.notFoundText}>
              {error ? "Couldn't load this vendor" : "Vendor not found"}
            </Text>
            {error ? (
              <Button
                title="Retry"
                onPress={() => loadVendors()}
                style={styles.notFoundButton}
              />
            ) : null}
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              style={styles.notFoundButton}
            />
          </>
        )}
      </View>
    );
  }

  const selectedPkg = vendor.packages.find((p) => p.id === selectedPackage);

  const _handleAddonToggle = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedPackage || !name || !phone || !email) {
      useToastStore
        .getState()
        .showToast("Please fill in all required fields", "warning");
      return;
    }
    if (!user?.id) {
      useToastStore.getState().showToast("Please log in to book a vendor", "error");
      return;
    }
    if (!selectedPkg?.id) {
      useToastStore
        .getState()
        .showToast("Please select a package to continue", "warning");
      return;
    }

    setSubmitting(true);

    // H1 fix: consult availability before creating the booking. This is a
    // UX check only — the DB partial unique index
    // uq_vendor_bookings_active_date is the authoritative guard against
    // double-booking races.
    const availability = await checkVendorAvailability(vendor.id, selectedDate);
    if (!availability.success || !availability.available) {
      setSubmitting(false);
      useToastStore
        .getState()
        .showToast(
          "This vendor appears unavailable on the selected date. Please pick another date.",
          "warning"
        );
      return;
    }

    const result = await createBooking({
      vendorId: vendor.id,
      userId: user.id,
      eventDate: selectedDate,
      eventType: "Wedding",
      packageId: selectedPkg.id,
      customRequirements: specialRequests || undefined,
      totalAmount: 0, // authoritative values are set by the server trigger
      advanceAmount: 0, // (see set_authoritative_booking_price)
      // M4 fix: persist customer contact details — previously collected but
      // silently dropped, leaving vendors unable to reach the booker.
      contactName: name,
      contactPhone: phone,
      contactEmail: email,
      status: "pending",
      paymentStatus: "pending",
      bookingDate: new Date().toISOString(),
      notes: guestCount ? `Number of guests: ${guestCount}` : undefined,
    });
    setSubmitting(false);

    if (!result.success || !result.bookingId) {
      useToastStore
        .getState()
        .showToast(result.error || "Failed to create booking", "error");
      return;
    }

    setBookingId(result.bookingId);
    setShowPayment(true);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={Colors.light.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Vendor</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Vendor Info */}
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.vendorCategory}>{vendor.category}</Text>
            <Text style={styles.vendorPrice}>{vendor.priceRange}</Text>
          </View>

          {/* Event Date */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Event Date *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          {/* Select Package */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Select Package *</Text>
            </View>
            {vendor.packages.map((pkg, idx) => (
              <TouchableOpacity
                key={pkg.id ?? idx}
                style={[
                  styles.packageOption,
                  selectedPackage === pkg.id && styles.selectedPackage,
                ]}
                onPress={() => setSelectedPackage(pkg.id ?? null)}
              >
                <View style={styles.packageHeader}>
                  <Text style={styles.packageTitle}>
                    {pkg.title ?? pkg.name ?? ""}
                  </Text>
                  <Text style={styles.packagePrice}>
                    {String(pkg.price ?? "")}
                  </Text>
                </View>
                <View style={styles.packageFeatures}>
                  {(pkg.features ?? pkg.items ?? [])
                    .slice(0, 3)
                    .map((feature, index) => (
                      <Text key={index} style={styles.packageFeature}>
                        • {feature}
                      </Text>
                    ))}
                </View>
                {selectedPackage === pkg.id && (
                  <View style={styles.selectedIndicator}>
                    <Check size={16} color={Colors.light.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Guest Count */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Number of Guests</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., 200"
              value={guestCount}
              onChangeText={setGuestCount}
              keyboardType="numeric"
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.light.textLight}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.light.textLight}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Special Requests</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requirements or questions..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.light.textLight}
            />
          </View>

          {/* Payment Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Option *</Text>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentOption === "advance" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentOption("advance")}
            >
              <View style={styles.paymentHeader}>
                <View style={styles.radioButton}>
                  {paymentOption === "advance" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Pay Advance</Text>
                  <Text style={styles.paymentDescription}>
                    Pay {STANDARD_ADVANCE_PERCENT}% now to confirm booking
                  </Text>
                </View>
              </View>
              {paymentOption === "advance" && (
                <View style={styles.advanceSlider}>
                  <Text style={styles.advanceLabel}>
                    Advance amount: {STANDARD_ADVANCE_PERCENT}% of the package
                    price (set by the vendor)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentOption === "full" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentOption("full")}
            >
              <View style={styles.paymentHeader}>
                <View style={styles.radioButton}>
                  {paymentOption === "full" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Pay Full Amount</Text>
                  <Text style={styles.paymentDescription}>
                    Pay complete amount now
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Price Summary */}
          {selectedPkg && (
            <View style={styles.priceSummary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Package</Text>
                <Text style={styles.summaryValue}>{selectedPkg.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Price</Text>
                <Text style={styles.summaryValue}>{selectedPkg.price}</Text>
              </View>
              {guestCount && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Guests</Text>
                  <Text style={styles.summaryValue}>{guestCount}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>
                  {paymentOption === "advance"
                    ? `Advance Payment (${STANDARD_ADVANCE_PERCENT}%)`
                    : "Total Payment"}
                </Text>
                <Text style={styles.summaryValueBold}>
                  {paymentOption === "advance"
                    ? `~${STANDARD_ADVANCE_PERCENT}% of total`
                    : selectedPkg.price}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={submitting ? "Creating booking..." : "Confirm Booking"}
            onPress={handleSubmitBooking}
            loading={submitting}
            style={styles.bookButton}
          />
        </View>
      </SafeAreaView>

      {bookingId && user && (
        <PaymentScreen
          visible={showPayment}
          onClose={() => setShowPayment(false)}
          onComplete={(result) => {
            if (!result.success) return; // failure UI shown inside PaymentScreen
            setShowPayment(false);
            router.push({
              pathname: "/booking-confirmation",
              params: {
                vendorName: vendor.name,
                packageName: selectedPkg?.title || "",
                packagePrice: String(selectedPkg?.price ?? ""),
                date: selectedDate,
                name,
                phone,
                email,
                guestCount,
                paymentOption,
                advanceAmount: String(STANDARD_ADVANCE_PERCENT),
              },
            });
          }}
          bookingId={bookingId}
          userId={user.id}
          vendorId={vendor.id}
          vendorName={vendor.name}
          amount={parseFloat(
            String(selectedPkg?.price ?? "0").replace(/[^0-9.]/g, "") || "0"
          )}
          paymentType={paymentOption}
          advancePercentage={STANDARD_ADVANCE_PERCENT}
          userName={name}
          userEmail={email}
          userPhone={phone}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  notFoundText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 16,
  },
  notFoundButton: {
    minWidth: 160,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  content: {
    flex: 1,
  },
  vendorInfo: {
    padding: 20,
    backgroundColor: Colors.light.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  vendorName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  vendorPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.white,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  packageOption: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.light.background,
    position: "relative",
  },
  selectedPackage: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: Colors.light.softBackground,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  packagePrice: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
  },
  packageFeatures: {
    gap: 4,
  },
  packageFeature: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  selectedIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  priceSummary: {
    margin: 20,
    padding: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  bookButton: {
    width: "100%",
  },
  paymentOption: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.light.white,
  },
  selectedPayment: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.softBackground,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  advanceSlider: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  advanceLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  advanceOptions: {
    flexDirection: "row",
    gap: 8,
  },
  advanceChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.white,
    alignItems: "center",
  },
  selectedAdvanceChip: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  advanceChipText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  selectedAdvanceChipText: {
    color: Colors.light.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  summaryLabelBold: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  summaryValueBold: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
  },
});
