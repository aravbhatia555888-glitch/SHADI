import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Typography from "@/constants/typography";
import { FontWeight } from "@/types/styles";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
Calendar,
CheckCircle,
Home,
Mail,
Package,
Phone,
User,
} from "lucide-react-native";
import {
SafeAreaView,
ScrollView,
StyleSheet,
Text,
View
} from "react-native";

export default function BookingConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { vendorName, packageName, date, name, phone, email, guestCount } =
    params;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <CheckCircle
              size={80}
              color={Colors.light.success}
              strokeWidth={2}
            />
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Booking Request Sent!</Text>
          <Text style={styles.subtitle}>
            Your booking request has been sent to {vendorName}. They will
            contact you shortly to confirm the details.
          </Text>

          {/* Booking Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Booking Details</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Package size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Package</Text>
                <Text style={styles.detailValue}>{packageName}</Text>
              </View>
            </View>

            {date && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Event Date</Text>
                  <Text style={styles.detailValue}>{date}</Text>
                </View>
              </View>
            )}

            {guestCount && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>{guestCount}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Contact Info Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Your Contact Information</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{name}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Phone size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{phone}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Mail size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{email}</Text>
              </View>
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <Text style={styles.nextStepsText}>
              • The vendor will review your request{"\n"}• They'll contact you
              within 24-48 hours{"\n"}• You can discuss final details and
              confirm{"\n"}• Check your messages for updates
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            title="Back to Home"
            onPress={() => router.push("/(tabs)/home")}
            renderIcon={() => <Home size={20} color={Colors.light.white} />}
            style={styles.homeButton}
          />
          <Button
            title="View Messages"
            onPress={() => router.push("/(tabs)/messages")}
            variant="outline"
            style={styles.messagesButton}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  successIcon: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  nextSteps: {
    width: "100%",
    backgroundColor: Colors.light.surfaceSoft,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  nextStepsTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  nextStepsText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  homeButton: {
    width: "100%",
  },
  messagesButton: {
    width: "100%",
  },
});
