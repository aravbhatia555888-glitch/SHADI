import LoadingSkeleton from "@/components/LoadingSkeleton";
import Colors from "@/constants/colors";
import { StyleSheet,View } from "react-native";

export default function ConversationSkeleton() {
  return (
    <View
      style={styles.row}
      accessibilityLabel="Loading conversation"
      accessibilityRole="progressbar"
    >
      <LoadingSkeleton width={48} height={48} borderRadius={24} />
      <View style={styles.content}>
        <LoadingSkeleton width="60%" height={16} style={styles.name} />
        <LoadingSkeleton width="80%" height={12} />
      </View>
      <LoadingSkeleton width={40} height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  content: { flex: 1, marginLeft: 12 },
  name: { marginBottom: 6 },
});
