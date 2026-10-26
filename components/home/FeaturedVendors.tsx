import VendorCard from "@/components/VendorCard";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Vendor } from "@/schemas/wedding";
import React from "react";
import { StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface FeaturedVendorsProps {
  vendors: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
  onViewAllPress: () => void;
}

function FeaturedVendors({
  vendors,
  onVendorPress,
  onViewAllPress,
}: FeaturedVendorsProps) {
  if (vendors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Vendors</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          accessibilityRole="button"
          accessibilityLabel="See all vendors"
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} onPress={onVendorPress} />
      ))}
    </View>
  );
}

export default React.memo(FeaturedVendors);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
  },
});
