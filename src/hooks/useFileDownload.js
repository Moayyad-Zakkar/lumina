import { useState } from 'react';
import { downloadFile } from '../helper/storageUtils';
import toast from 'react-hot-toast';

export const useFileDownload = () => {
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());

  const downloadSingleFile = async (storedUrl, fileName = 'download') => {
    if (!storedUrl) {
      toast.error('No file URL available');
      return;
    }

    // Add to downloading set to show loading state
    setDownloadingFiles((prev) => new Set([...prev, storedUrl]));

    try {
      //console.log('Starting download for:', fileName);

      const result = await downloadFile(storedUrl);

      if (result.success) {
        toast.success(`${fileName} downloaded successfully`);
      } else {
        toast.error(`Failed to download ${fileName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message}`);
    } finally {
      // Remove from downloading set
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(storedUrl);
        return newSet;
      });
    }
  };

  const downloadAllFiles = async (caseData) => {
    const filesToDownload = [];

    // Build list of files to download
    if (caseData.upper_jaw_scan_url) {
      filesToDownload.push({
        url: caseData.upper_jaw_scan_url,
        name: 'Upper Jaw Scan',
      });
    }
    if (caseData.lower_jaw_scan_url) {
      filesToDownload.push({
        url: caseData.lower_jaw_scan_url,
        name: 'Lower Jaw Scan',
      });
    }
    if (caseData.bite_scan_url) {
      filesToDownload.push({
        url: caseData.bite_scan_url,
        name: 'Bite Scan',
      });
    }
    if (caseData.compressed_scans_url) {
      filesToDownload.push({
        url: caseData.compressed_scans_url,
        name: 'All-in-One',
      });
    }
    if (caseData.additional_files_urls?.length > 0) {
      caseData.additional_files_urls.forEach((url, index) => {
        filesToDownload.push({
          url,
          name: `Additional File ${index + 1}`,
        });
      });
    }

    if (filesToDownload.length === 0) {
      toast.error('No files available for download');
      return;
    }

    // Show initial toast
    const downloadToast = toast.loading(
      `Downloading ${filesToDownload.length} file(s)...`
    );

    let successCount = 0;
    let failCount = 0;

    // Download files with error tracking
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];

      try {
        // Add to downloading set
        setDownloadingFiles((prev) => new Set([...prev, file.url]));

        const result = await downloadFile(file.url);

        if (result.success) {
          successCount++;
          //console.log(`✓ Downloaded: ${file.name}`);
        } else {
          failCount++;
          console.error(`✗ Failed: ${file.name} - ${result.error}`);
        }
      } catch (error) {
        failCount++;
        console.error(`✗ Failed: ${file.name} - ${error.message}`);
      } finally {
        // Remove from downloading set
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file.url);
          return newSet;
        });
      }

      // Small delay between downloads to avoid overwhelming browser
      if (i < filesToDownload.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Update toast with final result
    toast.dismiss(downloadToast);

    if (failCount === 0) {
      toast.success(`All ${successCount} files downloaded successfully!`);
    } else if (successCount === 0) {
      toast.error(`Failed to download all ${filesToDownload.length} files`);
    } else {
      toast.success(`Downloaded ${successCount} files (${failCount} failed)`);
    }
  };

  return {
    downloadingFiles,
    downloadSingleFile,
    downloadAllFiles,
  };
};
