import Colors from "@/constants/colors";
import { Control, Radius, Spacing } from "@/constants/layout";
import Typography from "@/constants/typography";
import type { ReactNode } from "react";
import {
StyleSheet,
Text,
TextInput,
View,
type StyleProp,
type TextInputProps,
type TextStyle,
} from "react-native";

interface AuthTextInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
}

/**
 * Labelled text field used by every auth screen. Uses a min-height (not a
 * fixed height) so larger accessibility font sizes don't clip the text.
 */
export default function AuthTextInput({
  label,
  error,
  leftAccessory,
  rightAccessory,
  inputStyle,
  style,
  ...props
}: AuthTextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        {leftAccessory}
        <TextInput
          style={[styles.input, inputStyle, style]}
          placeholderTextColor={Colors.light.textLight}
          {...props}
        />
        {rightAccessory}
      </View>
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500",
    color: Colors.light.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: Control.inputMinHeight,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: Radius.md,
    borderWidth: 1.4,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  rowError: {
    borderColor: Colors.light.error,
  },
  input: {
    flex: 1,
    minHeight: Control.inputMinHeight - 2,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  error: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.error,
  },
});
