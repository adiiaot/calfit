-- ─────────────────────────────────────────────────────────────
-- Storage bucket RLS policies for partner-media
--
-- Run this in Supabase Dashboard → SQL Editor after creating
-- the "partner-media" bucket in Storage.
--
-- These policies allow:
--   Authenticated users to upload files to their own folder
--   Anyone (including partners) to download files
--   Users to delete their own uploads
-- ─────────────────────────────────────────────────────────────

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read media files
CREATE POLICY "Anyone can read media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'partner-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
