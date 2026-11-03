import { Spacing } from "@/constants/layout";
import type { ReactNode } from "react";
import { StyleSheet,View,type StyleProp,type ViewStyle } from "react-native";

interface AuthFooterProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function AuthFooter({ children, style }: AuthFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
  },
});
