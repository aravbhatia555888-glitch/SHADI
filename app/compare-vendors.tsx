import VendorCard from "@/components/VendorCard";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Typography from "@/constants/typography";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { getVendorComparisonSummary } from "@/utils/vendor-comparison";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
Award,
Check,
ChevronLeft,
Crown,
TrendingUp,
Wallet,
X
} from "lucide-react-native";
import {
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

export default function CompareVendorsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const { vendors } = useWeddingStore();

  const vendorIds = ids ? ids.split(",") : [];
  const compareVendors = vendors.filter((v) => vendorIds.includes(v.id));

  if (compareVendors.length < 2) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>
          Select at least 2 vendors to compare
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Recommendation helpers (pure logic in utils/vendor-comparison) ─────
  const comparisonSummary = getVendorComparisonSummary(compareVendors);
  const bestRated = comparisonSummary?.bestRated;
  const bestValue = comparisonSummary?.bestValue;
  const verifiedNames = comparisonSummary?.verifiedVendors.map((v) => v.name) ?? [];

  const handleBookVendor = (vendorId: string) => {
    router.push({
      pathname: "/booking/[vendorId]",
      params: { vendorId },
    });
  };

  const renderComparisonRow = (
    label: string,
    values: (string | number | boolean | undefined)[]
  ) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.valuesRow}>
        {values.map((value, i) => (
          <View key={i} style={styles.valueCell}>
            {typeof value === "boolean" ? (
              <View
                accessible
                accessibilityLabel={value ? "Yes" : "No"}
                accessibilityRole="text"
              >
                {value ? (
                  <Check size={20} color={Colors.light.success} />
                ) : (
                  <X size={20} color={Colors.light.error} />
                )}
              </View>
            ) : (
              <Text style={styles.valueText}>{value || "N/A"}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Vendors</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recommendation summary */}
        <View style={styles.recommendationsCard}>
          <View style={styles.recommendationsHeader}>
            <Crown size={16} color={Colors.light.primary} />
            <Text style={styles.recommendationsTitle}>Best Picks</Text>
          </View>
          <View style={styles.recommendationRow}>
            <TrendingUp size={16} color={Colors.light.primary} />
            <Text style={styles.recommendationText}>
              <Text style={styles.recommendationLabel}>Highest rated: </Text>
              {bestRated?.name} ({bestRated?.rating}★)
            </Text>
          </View>
          <View style={styles.recommendationRow}>
            <Wallet size={16} color={Colors.light.success} />
            <Text style={styles.recommendationText}>
              <Text style={styles.recommendationLabel}>Best value: </Text>
              {bestValue?.name} ({bestValue?.priceRange})
            </Text>
          </View>
          <View style={styles.recommendationRow}>
            <Award size={16} color={Colors.light.primary} />
            <Text style={styles.recommendationText}>
              <Text style={styles.recommendationLabel}>Verified: </Text>
              {verifiedNames.length > 0
                ? verifiedNames.join(", ")
                : "None of the selected vendors"}
            </Text>
          </View>
        </View>

        <View style={styles.comparisonTable}>
          <View style={styles.headerRow}>
            <View style={styles.labelCell} />
            {compareVendors.map((vendor) => (
              <View key={vendor.id} style={styles.vendorHeader}>
                <VendorCard
                  vendor={vendor}
                  showRating
                  showPriceRange
                  style={styles.vendorCard}
                  onPress={() =>
                    router.push({
                      pathname: "/vendor/[id]",
                      params: { id: vendor.id },
                    })
                  }
                />
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBookVendor(vendor.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${vendor.name}`}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {renderComparisonRow(
            "Rating",
            compareVendors.map((v) => `${v.rating} (${v.reviewCount} reviews)`)
          )}
          {renderComparisonRow(
            "Price Range",
            compareVendors.map((v) => v.priceRange)
          )}
          {renderComparisonRow(
            "Min Price",
            compareVendors.map(
              (v) => `₹${v.minPrice?.toLocaleString("en-IN") || 0}`
            )
          )}
          {renderComparisonRow(
            "Max Price",
            compareVendors.map(
              (v) => `₹${v.maxPrice?.toLocaleString("en-IN") || 0}`
            )
          )}
          {renderComparisonRow(
            "Category",
            compareVendors.map((v) => v.category)
          )}
          {renderComparisonRow(
            "Location",
            compareVendors.map((v) =>
              typeof v.location === "string"
                ? v.location
                : v.location?.city || "N/A"
            )
          )}
          {renderComparisonRow(
            "Verified",
            compareVendors.map((v) => v.verified)
          )}
          {renderComparisonRow(
            "Available",
            compareVendors.map((v) => v.isAvailable)
          )}
          {renderComparisonRow(
            "Phone",
            compareVendors.map((v) => v.contact?.phone || "N/A")
          )}
          {renderComparisonRow(
            "Email",
            compareVendors.map((v) => v.contact?.email || "N/A")
          )}
          {renderComparisonRow(
            "Services",
            compareVendors.map((v) => `${v.services?.length || 0} services`)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
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
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  scrollContent: { paddingVertical: 16 },
  comparisonTable: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", marginBottom: 16 },
  labelCell: { width: 120 },
  vendorHeader: { width: 220, marginLeft: 12 },
  vendorCard: { marginBottom: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  recommendationsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.light.softBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  recommendationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  recommendationsTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
    marginTop: 6,
  },
  recommendationText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    flex: 1,
  },
  recommendationLabel: {
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  bookButton: {
    marginTop: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: Colors.light.background,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700" as FontWeight,
  },
  rowLabel: {
    width: 120,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.textLight,
  },
  valuesRow: { flexDirection: "row" },
  valueCell: {
    width: 220,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    textAlign: "center",
  },
  errorText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.light.text,
    textAlign: "center",
    marginTop: 100,
  },
  backLink: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.primary,
    textAlign: "center",
    marginTop: 16,
  },
});
