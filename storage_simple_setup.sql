-- Simple Storage Setup for 3DA application
-- This script creates basic policies that work with Supabase storage
-- Run this in your Supabase SQL editor

-- 1. Create a simple policy that allows authenticated users to access files
-- This is a more permissive policy that should work for your use case
CREATE POLICY "Allow authenticated users to access case files" ON storage.objects
FOR ALL USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 2. Create a policy for file uploads
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 3. Create a policy for file updates
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 4. Create a policy for file deletions
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 5. Verify the setup
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files') THEN
    RAISE NOTICE 'Warning: Storage bucket "case-files" does not exist. Please create it first in the Storage section.';
  ELSE
    RAISE NOTICE 'Storage bucket "case-files" exists.';
  END IF;
  
  -- Check if policies were created
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') THEN
    RAISE NOTICE 'Storage policies have been created successfully.';
  ELSE
    RAISE NOTICE 'Warning: No storage policies found. Check if RLS is enabled.';
  END IF;
END $$;
