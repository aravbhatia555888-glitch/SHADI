import Colors from "@/constants/colors";
import React from "react";
import { StyleProp,StyleSheet,View,ViewStyle } from "react-native";

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "elevated" | "outlined";
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: "summary" | "none";
}

export default function Card({
  children,
  style,
  variant = "default",
  testID,
  accessibilityLabel,
  accessibilityRole,
}: CardProps) {
  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.elevated,
    variant === "outlined" && styles.outlined,
    style,
  ];

  return (
    <View
      style={cardStyle}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  elevated: {
    shadowColor: Colors.light.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
});
