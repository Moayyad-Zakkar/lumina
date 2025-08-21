-- Storage bucket setup and RLS policies for 3DA application
-- Run this in your Supabase SQL editor

-- 1. Create the storage bucket if it doesn't exist
-- Note: This requires admin privileges
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-files',
  'case-files',
  false, -- Set to true if you want public access
  52428800, -- 50MB limit
  ARRAY[
    'application/octet-stream', -- STL files
    'model/stl',
    'model/obj', 
    'model/ply',
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;

-- 4. Create RLS policies for the storage bucket
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

-- 5. Admin policies (for admin users)
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

-- 6. Drop existing function if it exists
DROP FUNCTION IF EXISTS get_case_file_url(text, integer);

-- 7. Create a function to get signed URLs for case files
CREATE OR REPLACE FUNCTION get_case_file_url(file_path text, expires_in integer DEFAULT 3600)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Check if user has access to this file
  IF NOT EXISTS (
    SELECT 1 FROM cases c 
    WHERE c.user_id = auth.uid() 
    AND (
      c.upper_jaw_scan_url LIKE '%' || file_path || '%' OR
      c.lower_jaw_scan_url LIKE '%' || file_path || '%' OR
      c.bite_scan_url LIKE '%' || file_path || '%' OR
      c.additional_files_urls::text LIKE '%' || file_path || '%'
    )
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return the signed URL (this would need to be implemented with actual Supabase storage API)
  -- For now, return the public URL
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/case-files/' || file_path;
END;
$$;

-- 8. Grant necessary permissions (these are safe to run multiple times)
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 9. Verify the setup
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files') THEN
    RAISE NOTICE 'Warning: Storage bucket "case-files" was not created. You may need admin privileges.';
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
