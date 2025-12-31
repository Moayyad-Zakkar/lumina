// storageUtils.js - Updated download with visible progress
import supabase from './supabaseClient';
import toast from 'react-hot-toast';

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKET = 'case-files';

// Edge Function URL for Telegram backup
const TELEGRAM_API_URL = `${
  import.meta.env.VITE_SUPABASE_URL
}/functions/v1/telegram-backup`;

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
 * Upload file to Telegram via Edge Function as backup
 */
const uploadToTelegram = async (file, metadata = {}) => {
  try {
    // Get current session for authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('❌ No active session:', sessionError);
      throw new Error('User must be authenticated');
    }

    const userId = session.user.id;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', metadata.folderPath || '');
    formData.append('caseId', metadata.caseId || '');
    formData.append('patientName', metadata.patientName || '');
    formData.append('doctorName', metadata.doctorName || '');
    formData.append('clinicName', metadata.clinicName || '');
    formData.append('fileType', metadata.fileType || '');
    formData.append('userId', userId);

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Backup failed');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Backup error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload file to storage WITH automatic Telegram backup via Edge Function
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
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxFileSize) {
      throw new Error('File too large (max 100MB)');
    }

    // Show upload toast
    const uploadToast = toast.loading('Uploading...');

    // Use Edge Function which handles BOTH Supabase upload AND Telegram backup
    if (!skipTelegramBackup) {
      const telegramResult = await uploadToTelegram(file, {
        folderPath,
        caseId: metadata.caseId,
        patientName: metadata.patientName,
        doctorName: metadata.doctorName,
        clinicName: metadata.clinicName,
        fileType: metadata.fileType || folderPath.split('/').pop(),
      });

      if (telegramResult.success) {
        toast.success('File uploaded', {
          id: uploadToast,
        });

        return {
          success: true,
          filePath: telegramResult.data.filePath,
          fileName: telegramResult.data.fileName,
          originalName: telegramResult.data.originalName,
        };
      } else {
        console.warn(
          'Backup failed, uploading to Supabase only:',
          telegramResult.error
        );
        toast.loading('Uploading...', {
          id: uploadToast,
        });
      }
    }

    // Fallback: Direct Supabase upload
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

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

    toast.success('File uploaded successfully', { id: uploadToast });

    return {
      success: true,
      filePath,
      fileName,
      originalName: file.name,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(`Upload failed, please try again!`);
    return { success: false, error: error.message };
  }
};

/**
 * IMPROVED: Download with visible browser progress
 * Shows the file in browser's download manager with progress bar
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

    // Extract filename for better UX
    const filename = parsed.objectPath.split('/').pop() || 'download';

    // Show preparing toast
    const downloadToast = toast.loading(`Preparing ${filename}...`);

    try {
      // Get a signed URL first (this is fast)
      const { data: signedUrlData, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(parsed.objectPath, 3600); // 1 hour expiry

      if (signError || !signedUrlData?.signedUrl) {
        throw new Error('Failed to generate download link');
      }

      // Update toast to show download starting
      toast.loading(`Starting download...`, { id: downloadToast });

      // Use fetch with response streaming for progress tracking
      const response = await fetch(signedUrlData.signedUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the total size if available
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Create a reader to stream the response
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;

      // Read the stream and track progress
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress in toast if we know the total size
        if (total > 0) {
          const percentComplete = Math.round((receivedLength / total) * 100);
          toast.loading(`Downloading ${filename}... ${percentComplete}%`, {
            id: downloadToast,
          });
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks);

      // Create object URL and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Success toast
      toast.success(`Download started`, { id: downloadToast });

      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss(downloadToast);
      throw error;
    }
  } catch (error) {
    console.error('Download failed:', error);
    const errorMessage = error.message.includes('not found')
      ? 'File not found'
      : error.message.includes('permission')
      ? 'Access denied'
      : 'Download failed';

    toast.error(`${errorMessage}. Please try again!`);
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
