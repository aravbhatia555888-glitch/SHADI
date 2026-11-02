import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import { ChevronLeft,Globe,Lock,Trash2,X } from "lucide-react-native";
import { useState } from "react";
import {
Alert,
Linking,
Modal,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { changePassword, deleteAccount, loading } = useAuthStore();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all three password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordError(null);
    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      closePasswordModal();
      useToastStore.getState().showToast("Password updated", "success");
    } else {
      setPasswordError(
        result.error || "Could not update your password. Try again."
      );
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={openPasswordModal}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            <View style={styles.settingLeft}>
              <Lock size={20} color={Colors.light.textLight} />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
            accessibilityRole="link"
            accessibilityLabel="Privacy policy"
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
            accessibilityRole="button"
            accessibilityLabel="Delete account"
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
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={closePasswordModal}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Current password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter current password"
              placeholderTextColor={Colors.light.textLight}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              accessibilityLabel="Current password"
            />

            <Text style={styles.fieldLabel}>New password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new password"
              placeholderTextColor={Colors.light.textLight}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              accessibilityLabel="New password"
            />

            <Text style={styles.fieldLabel}>Confirm new password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Re-enter new password"
              placeholderTextColor={Colors.light.textLight}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              accessibilityLabel="Confirm new password"
            />

            {passwordError ? (
              <Text
                style={styles.formError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {passwordError}
              </Text>
            ) : null}

            <Button
              title="Update Password"
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
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
    padding: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    borderColor: Colors.light.inputBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundAlt,
  },
  fieldLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
    marginBottom: 6,
  },
  formError: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    marginBottom: 8,
  },
  modalButton: {
    marginTop: 8,
  },
});
