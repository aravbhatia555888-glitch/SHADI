-- Supabase Storage Bucket Policies
-- Run this in your Supabase SQL Editor
-- Requires the 'images' bucket to exist (create it in Storage settings first)

-- Enable RLS on storage.objects (required for policy enforcement)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Ensure bucket settings restrict file size to 10MB and whitelist image MIME types
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'images';

-- Public read: anyone can view images (needed for vendor photos, profiles)
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
CREATE POLICY "Public read access for images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images'
  );

-- Users can upload to their own profile folder only with strict extension checks
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

-- Users can upload to the uploads folder (general uploads) with strict extension checks
DROP POLICY IF EXISTS "Users can upload to uploads folder" ON storage.objects;
CREATE POLICY "Users can upload to uploads folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

-- Users can delete their own images
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Users can update (replace) their own images
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );
