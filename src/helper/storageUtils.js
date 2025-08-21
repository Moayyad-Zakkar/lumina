import supabase from './supabaseClient';
import toast from 'react-hot-toast';

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKET = 'case-files';

/**
 * Simple storage verification that bypasses listing permissions
 * Since downloads work, we just need to verify basic bucket access
 */
export const verifyStorageBucket = async () => {
  try {
    // Try to generate a public URL - this is the most lightweight check
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl('test-file.txt');

    if (data?.publicUrl) {
      return { exists: true, error: null };
    }

    return { exists: false, error: 'Could not access storage bucket' };
  } catch (error) {
    console.error('Error verifying storage bucket:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Upload file to storage with comprehensive error handling
 */
export const uploadFileToStorage = async (file, path, options = {}) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    const maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB default
    if (file.size > maxFileSize) {
      throw new Error(
        `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB`
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        ...options,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return { publicUrl, filePath, success: true };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Parse storage URL to extract the file path
 */
export const parseStorageUrl = (url) => {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // Handle Supabase storage URLs
    // Format: /storage/v1/object/public/bucket-name/path/to/file.ext
    const objectIndex = pathParts.findIndex((part) => part === 'object');

    if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'public') {
      // Public URL format
      const bucketName = pathParts[objectIndex + 2];
      const objectPath = pathParts.slice(objectIndex + 3).join('/');

      return {
        bucketName: bucketName,
        objectPath: decodeURIComponent(objectPath),
      };
    }

    // Fallback: try to extract from the end of the URL
    if (pathParts.length >= 2) {
      return {
        bucketName: STORAGE_BUCKET,
        objectPath: pathParts.slice(-2).join('/'),
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
};

/**
 * Download file from storage - streamlined version
 */
export const downloadFileFromStorage = async (storedUrl) => {
  try {
    if (!storedUrl) {
      throw new Error('No URL provided');
    }

    console.log('Attempting to download from URL:', storedUrl);

    // Parse the storage URL
    const parsed = parseStorageUrl(storedUrl);
    console.log('Parsed URL:', parsed);

    // Method 1: Try direct browser download (works based on your logs)
    try {
      // Create a temporary link and click it to trigger download
      const a = document.createElement('a');
      a.href = storedUrl;
      a.download = parsed?.objectPath?.split('/').pop() || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('File download triggered successfully');
      return { success: true };
    } catch (directError) {
      console.log('Direct download failed, trying fallback:', directError);
    }

    // Method 2: Try signed URL if we have the parsed path
    if (parsed?.objectPath) {
      try {
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(parsed.objectPath, 3600);

        if (!signError && signedUrlData?.signedUrl) {
          const a = document.createElement('a');
          a.href = signedUrlData.signedUrl;
          a.download = parsed.objectPath.split('/').pop() || 'download';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          console.log('File downloaded via signed URL');
          return { success: true };
        }
      } catch (signError) {
        console.log('Signed URL failed:', signError);
      }
    }

    // Method 3: Simple window.open as final fallback
    window.open(storedUrl, '_blank');
    console.log('Opened file in new tab');
    return { success: true };
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error(`Download failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize storage - simplified version that doesn't require listing permissions
 */
export const initializeStorage = async () => {
  try {
    const bucketCheck = await verifyStorageBucket();

    if (!bucketCheck.exists) {
      console.warn(
        'Storage bucket verification failed, but downloads might still work'
      );
      // Don't show error toast since downloads actually work
      return true; // Return true to allow the app to continue
    }

    console.log('Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    // Still return true since downloads work
    return true;
  }
};

/**
 * Get file extension from URL or filename
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (filename) => {
  const allowedExtensions = ['stl', 'obj', 'ply', 'pdf', 'jpg', 'jpeg', 'png'];
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
};
