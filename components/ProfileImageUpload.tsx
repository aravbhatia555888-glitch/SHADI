import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import {
pickAndUploadProfileImage,
takePhotoAndUpload,
} from "@/services/imageUpload";
import { useToastStore } from "@/stores/toast-store";
import { Camera,Upload,User } from "lucide-react-native";
import { useState } from "react";
import {
ActionSheetIOS,
ActivityIndicator,
Alert,
Image,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  userId: string;
  size?: number;
  editable?: boolean;
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUploaded,
  userId,
  size = 100,
  editable = true,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const showImagePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Gallery"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickImage();
          }
        }
      );
    } else {
      Alert.alert("Select Image", "Choose how you want to select an image", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Gallery", onPress: handlePickImage },
      ]);
    }
  };

  const handlePickImage = async () => {
    setUploading(true);
    try {
      const result = await pickAndUploadProfileImage(userId);

      if (result.success && result.imageUrl) {
        onImageUploaded(result.imageUrl);
        useToastStore.getState().showToast("Profile picture updated successfully!", "success");
      } else {
        useToastStore.getState().showToast(result.error || "Failed to upload image", "error");
      }
    } catch (_error) {
      useToastStore.getState().showToast("An unexpected error occurred", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    setUploading(true);
    try {
      const result = await takePhotoAndUpload(userId);

      if (result.success && result.imageUrl) {
        onImageUploaded(result.imageUrl);
        useToastStore.getState().showToast("Profile picture updated successfully!", "success");
      } else {
        useToastStore.getState().showToast(result.error || "Failed to upload image", "error");
      }
    } catch (_error) {
      useToastStore.getState().showToast("An unexpected error occurred", "error");
    } finally {
      setUploading(false);
    }
  };

  const renderImage = () => {
    if (currentImageUrl) {
      return (
        <Image
          source={{ uri: currentImageUrl, cache: "force-cache" }}
          style={[
            styles.profileImage,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={[
          styles.defaultAvatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.light.backgroundAlt,
          },
        ]}
      >
        <User size={size * 0.5} color={Colors.light.textLight} />
      </View>
    );
  };

  const renderUploadButton = () => {
    if (!editable) return null;

    return (
      <TouchableOpacity
        style={[styles.uploadButton, { bottom: -5, right: -5 }]}
        onPress={showImagePicker}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel={
          uploading ? "Uploading profile picture" : "Change profile picture"
        }
      >
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.light.background} />
        ) : (
          <Camera size={16} color={Colors.light.background} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {renderImage()}
        {renderUploadButton()}
      </View>

      {editable && !uploading && (
        <TouchableOpacity
          style={styles.changeButton}
          onPress={showImagePicker}
          accessibilityRole="button"
          accessibilityLabel={currentImageUrl ? "Change photo" : "Add photo"}
        >
          <Upload size={14} color={Colors.light.primary} />
          <Text style={styles.changeButtonText}>
            {currentImageUrl ? "Change Photo" : "Add Photo"}
          </Text>
        </TouchableOpacity>
      )}

      {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  defaultAvatar: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  uploadButton: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.medium,
    marginLeft: 4,
  },
  uploadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginTop: 8,
  },
});
