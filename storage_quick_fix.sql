-- Quick Fix for Storage Issues
-- This creates a public bucket to get downloads working immediately
-- Run this in your Supabase SQL editor

-- 1. Create the storage bucket with public access (temporary fix)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-files',
  'case-files',
  true, -- Set to true for public access (temporary)
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
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/octet-stream',
    'model/stl',
    'model/obj', 
    'model/ply',
    'application/pdf',
    'image/jpeg',
    'image/png'
  ];

-- 2. Verify the setup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files') THEN
    RAISE NOTICE 'Storage bucket "case-files" created/updated successfully with public access.';
    RAISE NOTICE 'Downloads should now work. Consider setting up proper RLS policies later.';
  ELSE
    RAISE NOTICE 'Failed to create storage bucket. Check your permissions.';
  END IF;
END $$;
