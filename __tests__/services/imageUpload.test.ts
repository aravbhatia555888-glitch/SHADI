import {
  pickAndUploadProfileImage,
  uploadImageToSupabase,
  deleteImage,
  takePhotoAndUpload,
} from '@/services/imageUpload';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/config/supabase';

// The global mocks from jest.setup.js handle expo-image-picker,
// expo-file-system, and @/config/supabase. Here we import them
// so we can override specific mock return values per test.

describe('ImageUpload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickAndUploadProfileImage', () => {
    it('should successfully pick and upload image', async () => {
      const result = await pickAndUploadProfileImage('test-user-123');
      
      expect(result.success).toBe(true);
      // The mock supabase returns https://test-url.com/image.jpg from getPublicUrl
      expect(result.imageUrl).toBe('https://test-url.com/image.jpg');
      expect(result.error).toBeUndefined();
    });

    it('should handle permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' });

      const result = await pickAndUploadProfileImage('test-user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Photo library permission is required');
    });

    it('should handle cancelled image selection', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockResolvedValueOnce({ canceled: true });

      const result = await pickAndUploadProfileImage('test-user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Image selection cancelled');
    });

    it('should handle image picker errors', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Picker failed'));

      const result = await pickAndUploadProfileImage('test-user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Picker failed');
    });
  });

  describe('takePhotoAndUpload', () => {
    it('should successfully take photo and upload', async () => {
      const result = await takePhotoAndUpload('test-user-123');
      
      expect(result.success).toBe(true);
      // The mock supabase returns https://test-url.com/image.jpg from getPublicUrl
      expect(result.imageUrl).toBe('https://test-url.com/image.jpg');
      expect(result.error).toBeUndefined();
    });

    it('should handle camera permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' });

      const result = await takePhotoAndUpload('test-user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera permission is required');
    });

    it('should handle cancelled photo capture', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock)
        .mockResolvedValueOnce({ canceled: true });

      const result = await takePhotoAndUpload('test-user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Photo capture cancelled');
    });
  });

  describe('uploadImageToSupabase', () => {
    it('should upload image to supabase and return public URL', async () => {
      const result = await uploadImageToSupabase(
        'file://test-image.jpg',
        'test-user-123',
        'profile'
      );
      
      expect(result.success).toBe(true);
      // The mock getPublicUrl returns https://test-url.com/image.jpg
      expect(result.imageUrl).toBe('https://test-url.com/image.jpg');
    });
  });

  describe('deleteImage', () => {
    it('should delete image from supabase storage', async () => {
      // deleteImage parses the URL to extract file path, so use a proper Supabase URL format
      const result = await deleteImage('https://test-url.com/storage/v1/object/public/images/test-path.jpg');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // L9 fix: getOptimizedImageUrl was removed — Supabase Storage ignores
  // ?width/?height query params, so the helper was decorative.
});
