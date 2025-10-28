// storageUtils.js - Updated with Telegram backup integration
import supabase from './supabaseClient';
import toast from 'react-hot-toast';

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKET = 'case-files';

// Telegram API configuration
const TELEGRAM_API_URL =
  import.meta.env.VITE_TELEGRAM_API_URL ||
  'http://localhost:3001/api/telegram-backup';

// Log the API URL for debugging (remove this later)
console.log('Telegram API URL:', TELEGRAM_API_URL);

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
 * Upload file to Telegram as backup
 * DEFINED FIRST so uploadFile can use it
 */

const uploadToTelegram = async (file, metadata = {}) => {
  try {
    /*
    console.log('🔄 Starting Telegram backup...', {
      filename: file.name,
      size: file.size,
      type: file.type,
      apiUrl: TELEGRAM_API_URL,
    });
    */

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', metadata.caseId || '');
    formData.append('patientName', metadata.patientName || '');
    formData.append('doctorName', metadata.doctorName || '');
    formData.append('clinicName', metadata.clinicName || '');
    formData.append('fileType', metadata.fileType || '');

    console.log('📤 Sending request to:', TELEGRAM_API_URL);

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Telegram backup failed');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Telegram backup error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Upload file to storage WITH automatic Telegram backup
 * @param {File} file - The file to upload
 * @param {string} folderPath - The folder path in Supabase storage
 * @param {object} metadata - Optional metadata (caseId, patientName, fileType)
 * @param {boolean} skipTelegramBackup - Skip Telegram backup if true (default: false)
 */
export const uploadFile = async (
  file,
  folderPath,
  metadata = {},
  skipTelegramBackup = false
) => {
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

    // Show upload toast
    const uploadToast = toast.loading('Uploading file...');

    // 1. Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      toast.dismiss(uploadToast);
      throw uploadError;
    }

    toast.success('File uploaded to Supabase', { id: uploadToast });

    // 2. Backup to Telegram (optional but recommended)
    if (!skipTelegramBackup) {
      toast.loading('Backing up', { id: uploadToast });

      const telegramResult = await uploadToTelegram(file, {
        caseId: metadata.caseId,
        patientName: metadata.patientName,
        doctorName: metadata.doctorName,
        clinicName: metadata.clinicName,
        fileType: metadata.fileType || folderPath.split('/').pop(),
      });

      if (telegramResult.success) {
        toast.success('File backed up', { id: uploadToast });
      } else {
        // Don't fail the entire upload if Telegram backup fails
        console.warn('Backup failed:', telegramResult.error);
        toast.error('Backup failed (file saved to Supabase)', {
          id: uploadToast,
        });
      }
    } else {
      toast.dismiss(uploadToast);
    }

    return {
      success: true,
      filePath,
      fileName,
      originalName: file.name,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(`Upload failed: ${error.message}`);
    return { success: false, error: error.message };
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
