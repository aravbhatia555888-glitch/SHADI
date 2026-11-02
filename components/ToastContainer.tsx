import Colors from "@/constants/colors";
import { useToastStore,type Toast } from "@/stores/toast-store";
import { AlertCircle,AlertTriangle,CheckCircle,Info,X } from "lucide-react-native";
import { useEffect,useRef } from "react";
import {
AccessibilityInfo,
Animated,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

const TOAST_ICONS = {
  success: { icon: CheckCircle, color: Colors.light.success },
  error: { icon: AlertCircle, color: Colors.light.error },
  warning: { icon: AlertTriangle, color: Colors.light.warning },
  info: { icon: Info, color: Colors.light.primary },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AccessibilityInfo.announceForAccessibility(toast.message);
  }, [toast.message]);

  const Icon = TOAST_ICONS[toast.type]?.icon || Info;
  const iconColor = TOAST_ICONS[toast.type]?.color || Colors.light.primary;

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.toast,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        toast.type === "error" && styles.toastError,
        toast.type === "success" && styles.toastSuccess,
        toast.type === "warning" && styles.toastWarning,
      ]}
    >
      <View style={styles.toastContent}>
        <Icon size={20} color={iconColor} strokeWidth={1.5} />
        <Text
          style={styles.toastMessage}
          numberOfLines={2}
          accessibilityLiveRegion="polite"
        >
          {toast.message}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(toast.id)}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={12}
      >
        <X size={16} color={Colors.light.textLight} strokeWidth={1.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastError: {
    borderColor: Colors.light.error + "40",
    backgroundColor: Colors.light.error + "08",
  },
  toastSuccess: {
    borderColor: Colors.light.success + "40",
    backgroundColor: Colors.light.success + "08",
  },
  toastWarning: {
    borderColor: Colors.light.warning + "40",
    backgroundColor: Colors.light.warning + "08",
  },
  toastContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
