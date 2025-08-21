-- RLS Policies for 3DA storage bucket (assumes bucket already exists)
-- Run this in your Supabase SQL editor

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;

-- 3. Create RLS policies for the storage bucket
-- Policy for users to upload their own files
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'case-files' AND (
    -- Users can view files in their own folder
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Users can view files in cases they own
    EXISTS (
      SELECT 1 FROM cases c 
      WHERE c.user_id = auth.uid() 
      AND (
        c.upper_jaw_scan_url LIKE '%' || name || '%' OR
        c.lower_jaw_scan_url LIKE '%' || name || '%' OR
        c.bite_scan_url LIKE '%' || name || '%' OR
        c.additional_files_urls::text LIKE '%' || name || '%'
      )
    )
  )
);

-- Policy for users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Admin policies (for admin users)
-- Policy for admins to view all files
CREATE POLICY "Admins can view all files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'case-files' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Policy for admins to upload files
CREATE POLICY "Admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-files' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Policy for admins to update files
CREATE POLICY "Admins can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-files' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Policy for admins to delete files
CREATE POLICY "Admins can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-files' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- 5. Grant necessary permissions (these are safe to run multiple times)
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 6. Verify the setup
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
