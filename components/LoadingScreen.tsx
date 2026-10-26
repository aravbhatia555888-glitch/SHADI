import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { ActivityIndicator,StyleSheet,Text,View } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={Colors.light.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  message: {
    marginTop: 16,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
});
