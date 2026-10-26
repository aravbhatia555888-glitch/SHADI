import { handleSupabaseError,supabase } from "@/config/supabase";
import { decode } from "base64-arraybuffer";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

// Image upload security limits
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const _ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function pickAndUploadProfileImage(
  userId: string
): Promise<ImageUploadResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { success: false, error: "Photo library permission is required" };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: "Image selection cancelled" };
    }

    return await uploadImageToSupabase(
      result.assets[0].uri,
      userId,
      "profiles"
    );
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

export async function uploadImageToSupabase(
  imageUri: string,
  userId: string,
  folder: string = "uploads"
): Promise<ImageUploadResult> {
  try {
    // Validate file extension
    const ext = imageUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { success: false, error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` };
    }

    // Compress image before upload to reduce bandwidth and storage
    const compressed = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Use immutable filename (UUID) to prevent path squatting and overwrites.
    // expo-crypto.randomUUID is used because the global crypto.randomUUID is
    // not guaranteed to exist in the Hermes runtime.
    const fileName = `${folder}/${userId}/${Crypto.randomUUID()}.jpg`;

    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    // Validate file size after compression
    if (arrayBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` };
    }

    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, arrayBuffer, {
        contentType: "image/jpeg", // Always JPEG after compression
        upsert: false, // Never overwrite — use immutable filenames
      });

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return { success: true, imageUrl: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

export async function takePhotoAndUpload(
  userId: string
): Promise<ImageUploadResult> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { success: false, error: "Camera permission is required" };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: "Photo capture cancelled" };
    }

    return await uploadImageToSupabase(
      result.assets[0].uri,
      userId,
      "profiles"
    );
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/images/");
    if (pathParts.length < 2) {
      return { success: false, error: "Invalid image URL format" };
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage.from("images").remove([filePath]);
    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

