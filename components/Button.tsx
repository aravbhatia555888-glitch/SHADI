import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { hapticLight } from "@/utils/haptics";
import React from "react";
import {
ActivityIndicator,
Pressable,
StyleProp,
StyleSheet,
Text,
TextStyle,
View,
ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  renderIcon?: () => React.ReactNode;
  iconPosition?: "left" | "right";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
  minWidth?: number;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "medium",
  renderIcon,
  iconPosition = "left",
  style,
  textStyle,
  accessibilityLabel,
  testID,
  minWidth,
  fullWidth = false,
}: ButtonProps) {
  const getContainerStyle = ({ pressed }: { pressed: boolean }) => {
    const baseStyle: StyleProp<ViewStyle>[] = [styles.container];

    switch (variant) {
      case "secondary":
        baseStyle.push(styles.secondaryContainer);
        break;
      case "outline":
        baseStyle.push(styles.outlineContainer);
        break;
      case "ghost":
        baseStyle.push(styles.ghostContainer);
        break;
      default:
        baseStyle.push(styles.primaryContainer);
    }

    switch (size) {
      case "small":
        baseStyle.push(styles.smallContainer);
        break;
      case "large":
        baseStyle.push(styles.largeContainer);
        break;
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabledContainer);
    }

    if (pressed && !disabled && !loading) {
      baseStyle.push(styles.pressedContainer);
    }

    if (fullWidth) {
      baseStyle.push({ width: "100%" });
    }

    if (minWidth) {
      baseStyle.push({ minWidth });
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: StyleProp<TextStyle>[] = [styles.text];

    switch (variant) {
      case "secondary":
        baseStyle.push(styles.secondaryText);
        break;
      case "outline":
        baseStyle.push(styles.outlineText);
        break;
      case "ghost":
        baseStyle.push(styles.ghostText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    switch (size) {
      case "small":
        baseStyle.push(styles.smallText);
        break;
      case "large":
        baseStyle.push(styles.largeText);
        break;
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={
            variant === "primary"
              ? Colors.light.background
              : Colors.light.primary
          }
          size="small"
        />
      );
    }

    const iconElement = renderIcon?.();
    return (
      <View style={styles.contentContainer}>
        {iconPosition === "left" && iconElement}
        <Text style={getTextStyle()}>{title}</Text>
        {iconPosition === "right" && iconElement}
      </View>
    );
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      hapticLight();
      onPress();
    }
  };

  return (
    <Pressable
      style={getContainerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {renderContent()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryContainer: {
    backgroundColor: Colors.light.primary,
  },
  secondaryContainer: {
    backgroundColor: Colors.light.secondary,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  pressedContainer: {
    opacity: 0.8,
  },
  smallContainer: {
    height: 44,
    paddingHorizontal: 16,
  },
  largeContainer: {
    height: 56,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
  },
  primaryText: {
    color: Colors.light.background,
  },
  secondaryText: {
    color: Colors.light.primary,
  },
  outlineText: {
    color: Colors.light.primary,
  },
  ghostText: {
    color: Colors.light.primary,
  },
  smallText: {
    fontSize: Typography.fontSizes.sm,
  },
  largeText: {
    fontSize: Typography.fontSizes.lg,
  },
});
