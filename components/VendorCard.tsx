import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Vendor } from "@/schemas/wedding";
import { Camera,MapPin,ShieldCheck,Star } from "lucide-react-native";
import {
Image,
StyleProp,
StyleSheet,
Text,
TouchableOpacity,
View,
ViewStyle,
} from "react-native";
import Card from "./Card";
import Icon from "./Icon";

interface VendorCardProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  selected?: boolean;
  showRating?: boolean;
  showPriceRange?: boolean;
}

export default function VendorCard({
  vendor,
  onPress,
  style,
  testID,
  accessibilityLabel,
  selected = false,
  showRating = true,
  showPriceRange = true,
}: VendorCardProps) {
  const content = (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: vendor.coverImage }}
          style={styles.image}
          resizeMode="cover"
        />
        {vendor.verified && (
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={14} color={Colors.light.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <View style={styles.imageOverlay}>
          <View style={styles.photosCount}>
            <Icon icon={Camera} size={12} color={Colors.light.background} />
            <Text style={styles.photosCountText}>
              {vendor.photos?.length || 0} Photos
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{vendor.name}</Text>
          {showRating && (
            <View style={styles.ratingContainer}>
              <Icon
                icon={Star}
                size={12}
                color={Colors.light.secondary}
                fill={Colors.light.secondary}
              />
              <Text style={styles.rating}>{vendor.rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={14} color={Colors.light.textLight} strokeWidth={1.5} />
          <Text style={styles.location}>
            {typeof vendor.location === "string"
              ? vendor.location
              : `${vendor.location.city}, ${vendor.location.state}`}
          </Text>
        </View>

        {showPriceRange && (
          <View style={styles.footer}>
            <Text style={styles.priceRange}>{vendor.priceRange}</Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity
      onPress={() => onPress(vendor)}
      style={style}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? `View details for ${vendor.name}`
      }
      accessibilityState={{ selected }}
      testID={testID}
    >
      <Card variant="elevated">{content}</Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  photosCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photosCountText: {
    color: Colors.light.background,
    fontSize: Typography.fontSizes.xs,
    marginLeft: 4,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceRange: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.headerBackground,
    fontWeight: Typography.fontWeights.bold,
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  verifiedText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.success,
    marginLeft: 4,
    fontWeight: Typography.fontWeights.semiBold,
  },
});
