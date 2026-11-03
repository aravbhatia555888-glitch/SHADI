import Colors from "@/constants/colors";
import { Control, Spacing } from "@/constants/layout";
import Typography from "@/constants/typography";
import { FontWeight } from "@/types/styles";
import { StyleSheet,Text,View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  /** Show the SB monogram + wordmark (login screen). */
  logo?: boolean;
  align?: "center" | "left";
}

export default function AuthHeader({
  title,
  subtitle,
  logo = false,
  align = "center",
}: AuthHeaderProps) {
  const alignment = align === "center" ? "center" : "left";

  return (
    <View
      style={[
        styles.header,
        align === "left" ? styles.headerLeft : styles.headerCenter,
      ]}
    >
      {logo ? (
        <View style={styles.logo}>
          <Text style={styles.logoText}>SB</Text>
        </View>
      ) : null}
      {logo ? <Text style={styles.brand}>ShaadiBazaar</Text> : null}
      <Text style={[styles.title, { textAlign: alignment }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { textAlign: alignment }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xxl,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerLeft: {
    alignItems: "stretch",
  },
  logo: {
    width: Control.logoSize,
    height: Control.logoSize,
    borderRadius: Control.logoSize / 2,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 34,
    fontWeight: "800" as FontWeight,
    color: Colors.light.primary,
  },
  brand: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    lineHeight: 22,
    color: Colors.light.textLight,
  },
});
