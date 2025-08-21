# Storage Bucket Fix Instructions

## Problem

The STL file downloads are failing with the error: `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`

This happens because the storage bucket `case-files` either doesn't exist or doesn't have proper RLS (Row Level Security) policies configured.

## Solution

### Quick Fix (Recommended - Get Downloads Working Immediately)

If you're getting permission errors with the complex RLS policies, use this simple approach:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL script from `storage_quick_fix.sql` file
3. This will create a public bucket that allows downloads immediately
4. Test your downloads - they should work now

### Step 1: Create the Storage Bucket (Manual Method)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set the following:
   - **Name**: `case-files`
   - **Public bucket**: `true` (for immediate fix) or `false` (for security)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**:
     - `application/octet-stream` (STL files)
     - `model/stl`
     - `model/obj`
     - `model/ply`
     - `application/pdf`
     - `image/jpeg`
     - `image/png`

### Step 2: Set Up RLS Policies (Optional)

**Option A: Simple Policies (Recommended)**

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL script from `storage_simple_setup.sql` file
3. This creates basic policies that work with Supabase storage

**Option B: Complete Setup (Advanced)**

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL script from `storage_setup.sql` file
3. This script will:
   - Create the bucket if it doesn't exist
   - Drop existing policies to avoid conflicts
   - Create all necessary RLS policies
   - Grant proper permissions

**Option C: Policies Only (if bucket already exists)**

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL script from `storage_policies_only.sql` file
3. This script will:
   - Drop existing policies to avoid conflicts
   - Create all necessary RLS policies
   - Grant proper permissions

### Step 3: Alternative - Manual Setup

If you prefer to set up manually:

1. **Create the bucket** in the Storage section as described in Step 1
2. **Run the simple policies script** (`storage_simple_setup.sql`) in SQL Editor
3. **Verify the setup** by checking the Storage and Authentication > Policies sections

### Step 4: Verify the Setup

1. Check that the bucket exists in **Storage** section
2. Verify RLS policies are active in **Authentication > Policies** (if using policies)
3. Test file upload and download functionality

## Code Changes Made

### 1. Enhanced Error Handling

- Updated `CasePage.jsx` and `AdminCasePage.jsx` with better error handling
- Added bucket verification before attempting downloads
- Implemented fallback mechanisms for different error scenarios

### 2. Storage Utilities

- Created `src/helper/storageUtils.js` with comprehensive storage management functions
- Added bucket verification, file upload/download utilities
- Implemented proper error handling and user feedback

### 3. Improved User Experience

- Added toast notifications for better user feedback
- Implemented automatic storage initialization
- Added detailed error logging for debugging

## Testing the Fix

1. **Upload Test**: Try uploading new STL files in CaseSubmit
2. **Download Test**: Try downloading existing files in CasePage and AdminCasePage
3. **Error Handling**: Check browser console for detailed error messages
4. **Bucket Verification**: The app will now verify bucket existence and show helpful error messages

## Troubleshooting

### If SQL script fails with "must be owner of table objects":

- Use the `storage_quick_fix.sql` script instead
- This creates a public bucket that doesn't require complex RLS policies
- Downloads will work immediately with this approach

### If SQL script fails with "policy already exists":

- Use the updated `storage_setup.sql` or `storage_policies_only.sql` files
- These scripts now include `DROP POLICY IF EXISTS` statements to handle existing policies
- The scripts are safe to run multiple times

### If bucket creation fails:

- Ensure you have admin privileges in Supabase
- Check if the bucket name is already taken
- Verify your Supabase project settings

### If RLS policies fail:

- Use the `storage_simple_setup.sql` script for basic policies
- Or use the `storage_quick_fix.sql` for a public bucket approach
- Check that the `profiles` table exists with `role` column (if using admin policies)

### If downloads still fail:

- Check browser console for detailed error messages
- Verify the file URLs in the database are correct
- Test with a simple text file first to isolate the issue

## Security Considerations

- The quick fix uses a public bucket for immediate functionality
- Consider implementing proper RLS policies later for production
- The simple policies provide basic authentication checks
- File size and type restrictions are enforced at the bucket level

## Additional Notes

- The storage utilities automatically handle bucket verification
- Error messages are user-friendly and actionable
- The system includes fallback mechanisms for different scenarios
- All storage operations are logged for debugging purposes
- The updated SQL scripts are safe to run multiple times without conflicts
- Start with the quick fix to get downloads working, then add security later
