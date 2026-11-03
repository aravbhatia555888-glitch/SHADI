import Colors from "@/constants/colors";
import { Control, Spacing } from "@/constants/layout";
import type { ReactNode } from "react";
import {
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
View,
type StyleProp,
type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthScreenContainerProps {
  children: ReactNode;
  /** Vertically centre the content (used by success states). */
  center?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared, safe-area-aware scroll container for auth screens.
 *
 * - Applies top/bottom insets so content never sits under the Android
 *   status bar or navigation bar (including edge-to-edge on Android 15+).
 * - Keeps content in a centred, max-width column on tablets/desktop.
 * - Lets Android resize the window for the keyboard (adjustResize) instead of
 *   layering a fixed-height KeyboardAvoidingView that causes jumps.
 */
export default function AuthScreenContainer({
  children,
  center = false,
  contentStyle,
}: AuthScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xxl,
              paddingBottom: insets.bottom + Spacing.xxxl,
            },
            center && styles.centered,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: Control.contentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: Control.horizontalPadding,
    flexGrow: 1,
  },
  centered: {
    justifyContent: "center",
  },
});
