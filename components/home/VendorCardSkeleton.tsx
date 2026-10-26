import LoadingSkeleton from "@/components/LoadingSkeleton";
import Colors from "@/constants/colors";
import { StyleSheet,View } from "react-native";

export default function VendorCardSkeleton() {
  return (
    <View
      style={styles.card}
      accessibilityLabel="Loading vendor"
      accessibilityRole="progressbar"
    >
      <LoadingSkeleton width="100%" height={160} borderRadius={0} />
      <View style={styles.content}>
        <LoadingSkeleton width="70%" height={18} style={styles.title} />
        <LoadingSkeleton width="40%" height={14} style={styles.subtitle} />
        <View style={styles.row}>
          <LoadingSkeleton width={60} height={14} />
          <LoadingSkeleton width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  content: { padding: 16 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
