import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import { ChevronLeft,Globe,Lock,Moon,Trash2,X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
Alert,
Linking,
Modal,
ScrollView,
StyleSheet,
Switch,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { changePassword, deleteAccount, loading } = useAuthStore();
  const SETTINGS_STORAGE_KEY = "user_app_settings";
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed.darkMode === "boolean") setDarkMode(parsed.darkMode);
          if (typeof parsed.pushNotifications === "boolean") setPushNotifications(parsed.pushNotifications);
          if (typeof parsed.emailNotifications === "boolean") setEmailNotifications(parsed.emailNotifications);
        } catch (_err) {
          // ignore corrupted local preferences
        }
      }
    });
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    if (key === "darkMode") setDarkMode(value);
    else if (key === "pushNotifications") setPushNotifications(value);
    else if (key === "emailNotifications") setEmailNotifications(value);

    try {
      const current = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = current ? JSON.parse(current) : {};
      parsed[key] = value;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
    } catch (_err) {
      // ignore storage write errors
    }
  };

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      useToastStore.getState().showToast("Please fill in all fields", "warning");
      return;
    }
    if (newPassword.length < 6) {
      useToastStore
        .getState()
        .showToast("New password must be at least 6 characters", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      useToastStore.getState().showToast("Passwords do not match", "warning");
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      useToastStore
        .getState()
        .showToast("Password updated successfully", "success");
    } else {
      useToastStore
        .getState()
        .showToast(result.error || "Failed to change password", "error");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account and all associated data. This action cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              router.replace("/auth/login");
            } else {
              useToastStore
                .getState()
                .showToast(result.error || "Failed to delete account", "error");
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL("https://shaadibazaar.com/privacy").catch(() => {
      useToastStore.getState().showToast("Unable to open link", "error");
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={Colors.light.textLight} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(val) => updateSetting("darkMode", val)}
              trackColor={{
                false: Colors.light.border,
                true: Colors.light.primary,
              }}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(val) => updateSetting("pushNotifications", val)}
              trackColor={{
                false: Colors.light.border,
                true: Colors.light.primary,
              }}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={(val) => updateSetting("emailNotifications", val)}
              trackColor={{
                false: Colors.light.border,
                true: Colors.light.primary,
              }}
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Lock size={20} color={Colors.light.textLight} />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={Colors.light.textLight} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={Colors.light.error} />
              <Text style={[styles.settingText, styles.dangerText]}>
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Current password"
              placeholderTextColor={Colors.light.textLight}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New password"
              placeholderTextColor={Colors.light.textLight}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm new password"
              placeholderTextColor={Colors.light.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title={loading ? "Updating..." : "Update Password"}
              onPress={handleChangePassword}
              loading={loading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.headerBackground,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.textLight,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  dangerTitle: {
    color: Colors.light.error,
  },
  dangerText: {
    color: Colors.light.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  modalButton: {
    marginTop: 8,
  },
});
