import AuthTextInput from "@/components/auth/AuthTextInput";
import Colors from "@/constants/colors";
import { Eye,EyeOff } from "lucide-react-native";
import { useState } from "react";
import type { ReactNode } from "react";
import {
StyleSheet,
TouchableOpacity,
type TextInputProps,
} from "react-native";

interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftAccessory?: ReactNode;
}

export default function PasswordInput({
  label = "Password",
  error,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthTextInput
      {...props}
      label={label}
      error={error}
      secureTextEntry={!visible}
      rightAccessory={
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          hitSlop={8}
        >
          {visible ? (
            <EyeOff size={20} color={Colors.light.textLight} />
          ) : (
            <Eye size={20} color={Colors.light.textLight} />
          )}
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
