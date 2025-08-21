-- Basic Storage Policies for 3DA application
-- Run this AFTER creating the bucket manually in the Storage section
-- Run this in your Supabase SQL editor

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to access case files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- 3. Create basic policies for the case-files bucket
-- Policy for all operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow authenticated users to access case files" ON storage.objects
FOR ALL USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 4. Verify the setup
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files') THEN
    RAISE NOTICE 'ERROR: Storage bucket "case-files" does not exist.';
    RAISE NOTICE 'Please create the bucket first in the Supabase Dashboard > Storage section.';
  ELSE
    RAISE NOTICE 'SUCCESS: Storage bucket "case-files" exists.';
  END IF;
  
  -- Check if policies were created
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') THEN
    RAISE NOTICE 'SUCCESS: Storage policies have been created.';
  ELSE
    RAISE NOTICE 'WARNING: No storage policies found.';
  END IF;
END $$;
