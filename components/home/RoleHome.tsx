import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { useRouter } from "expo-router";
import {
AlertCircle,
ArrowRight,
CheckCircle2,
Clock,
Search,
Store,
} from "lucide-react-native";
import { type ReactNode,useEffect,useState } from "react";
import {
ActivityIndicator,
ScrollView,
StyleSheet,
Text,
View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Role = "vendor" | "explorer";

export default function RoleHome({ role }: { role: Role }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { myVendor, loadMyVendor } = useWeddingStore();

  const [checking, setChecking] = useState(role === "vendor");

  useEffect(() => {
    if (role !== "vendor") return;
    let cancelled = false;
    loadMyVendor().finally(() => {
      if (!cancelled) setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [role, loadMyVendor]);

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.kicker}>
          {role === "vendor" ? "Vendor" : "Exploring"}
        </Text>
        <Text style={styles.title}>Hi, {firstName}</Text>
        <Text style={styles.subtitle}>
          {role === "vendor"
            ? "Manage your listing and reach couples planning their big day."
            : "Browse India's best wedding vendors. No setup needed."}
        </Text>
      </View>

      {role === "vendor" ? (
        <View style={styles.card}>
          {checking ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : myVendor === null ? (
            <VendorBlock
              icon={<Store size={22} color={Colors.light.primary} />}
              title="You haven't listed your business yet"
              body="Add your services, city and starting price. We review new listings before they go live."
              cta="Submit your listing"
              onPress={() => router.push("/vendor-apply")}
            />
          ) : !myVendor.isApproved ? (
            <VendorBlock
              icon={<Clock size={22} color={Colors.light.warning} />}
              title="Your listing is under review"
              body={`“${myVendor.name}” is waiting for approval. We'll email you when it's live — you can add photos and details from the dashboard in the meantime.`}
              cta="Open vendor dashboard"
              onPress={() => router.push("/vendor-dashboard")}
            />
          ) : !myVendor.isAvailable ? (
            <VendorBlock
              icon={<AlertCircle size={22} color={Colors.light.warning} />}
              title="Your listing is paused"
              body={`“${myVendor.name}” is approved but currently hidden from couples.`}
              cta="Open vendor dashboard"
              onPress={() => router.push("/vendor-dashboard")}
            />
          ) : (
            <VendorBlock
              icon={<CheckCircle2 size={22} color={Colors.light.success} />}
              title="Your listing is live"
              body={`“${myVendor.name}” is visible to couples browsing vendors.`}
              cta="Open vendor dashboard"
              onPress={() => router.push("/vendor-dashboard")}
            />
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Search size={22} color={Colors.light.primary} />
          </View>
          <Text style={styles.cardTitle}>Find your wedding team</Text>
          <Text style={styles.cardText}>
            Venues, photographers, caterers and more. Save favorites and compare
            them side by side.
          </Text>
          <Button
            title="Browse vendors"
            onPress={() => router.push("/(tabs)/vendors")}
            size="large"
            renderIcon={() => (
              <ArrowRight size={20} color={Colors.light.background} />
            )}
            style={styles.cta}
          />
        </View>
      )}

      <Text style={styles.footnote}>
        Signed in as {role === "vendor" ? "a vendor" : "a guest explorer"}.
      </Text>
    </ScrollView>
  );
}

function VendorBlock({
  icon,
  title,
  body,
  cta,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{body}</Text>
      <Button
        title={cta}
        onPress={onPress}
        size="large"
        renderIcon={() => (
          <ArrowRight size={20} color={Colors.light.background} />
        )}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    backgroundColor: Colors.light.headerBackground,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  kicker: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800" as FontWeight,
    color: Colors.light.background,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    color: "rgba(255, 245, 228, 0.85)",
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  center: {
    paddingVertical: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 21,
    color: Colors.light.textLight,
  },
  cta: {
    marginTop: 20,
  },
  footnote: {
    marginTop: 8,
    textAlign: "center",
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
});
