import supabase from './supabaseClient';
import toast from 'react-hot-toast';

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKET = 'case-files';

/**
 * Parse storage URL to extract the file path
 */
export const parseStorageUrl = (urlOrPath) => {
  try {
    // If it's just a file path (like "upper-jaw-scans/file.stl"), return it directly
    if (!urlOrPath.startsWith('http')) {
      return {
        bucketName: STORAGE_BUCKET,
        objectPath: urlOrPath,
      };
    }

    // Handle full URLs
    const parsed = new URL(urlOrPath);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // Handle Supabase storage URLs
    const objectIndex = pathParts.findIndex((part) => part === 'object');

    if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'public') {
      const bucketName = pathParts[objectIndex + 2];
      const objectPath = pathParts.slice(objectIndex + 3).join('/');
      return {
        bucketName: bucketName,
        objectPath: decodeURIComponent(objectPath),
      };
    }

    // Fallback
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
 * SIMPLIFIED: Direct download function - no initialization needed!
 * Just click button → download file. That's it.
 */
export const downloadFile = async (storedUrlOrPath) => {
  try {
    if (!storedUrlOrPath) {
      toast.error('No file specified');
      return { success: false, error: 'No file specified' };
    }

    // Parse the file path
    const parsed = parseStorageUrl(storedUrlOrPath);

    if (!parsed?.objectPath) {
      toast.error('Invalid file path');
      return { success: false, error: 'Invalid file path' };
    }

    // Method 1: Try Supabase client download (most reliable)
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(parsed.objectPath);

      if (!downloadError && fileData) {
        // Create blob URL and trigger download
        const url = URL.createObjectURL(fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = parsed.objectPath.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Download started');
        return { success: true };
      }
    } catch (downloadError) {
      console.log('Direct download failed, trying signed URL:', downloadError);
    }

    // Method 2: Fallback to signed URL
    try {
      const { data: signedUrlData, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(parsed.objectPath, 3600);

      if (!signError && signedUrlData?.signedUrl) {
        window.open(signedUrlData.signedUrl, '_blank');
        toast.success('Download started');
        return { success: true };
      }

      throw signError;
    } catch (signError) {
      console.error('All download methods failed:', signError);
      throw signError;
    }
  } catch (error) {
    console.error('Download failed:', error);
    const errorMessage = error.message.includes('not found')
      ? 'File not found'
      : error.message.includes('permission')
      ? 'Access denied'
      : `Download failed: ${error.message}`;

    toast.error(errorMessage);
    return { success: false, error: error.message };
  }
};

/**
 * Upload file to storage - simplified version
 */
export const uploadFile = async (file, folderPath) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Basic validation
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      throw new Error('File too large (max 50MB)');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    toast.success('File uploaded successfully');
    return { success: true, filePath };
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(`Upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get file extension from filename
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
