import React from 'react';
import { Alert } from '../Alert';

const FileUploadSection = ({ formData, handleChange }) => {
  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        Required Scans
      </span>

      {/* Upload Method Selection */}
      <div className="w-full border-b border-neutral-border pb-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-bold font-body-bold text-default-font mb-3">
            Choose Upload Method
          </legend>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="individual"
              checked={formData.uploadMethod === 'individual'}
              onChange={handleChange}
              className="accent-blue-600 w-4 h-4"
            />
            <span>Individual Files (Upload each scan separately)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="compressed"
              checked={formData.uploadMethod === 'compressed'}
              onChange={handleChange}
              className="accent-blue-600 w-4 h-4"
            />
            <span>
              Compressed Archive (Upload all scans in one ZIP/RAR file)
            </span>
          </label>
        </fieldset>
      </div>

      {formData.uploadMethod === 'individual' && (
        <>
          <Alert
            title="Individual Files"
            description="Please upload each scan file separately. Ensure all scan files are in STL, OBJ, or PLY format."
          />

          <div>
            <label
              htmlFor="upperJawScan"
              className="block text-sm font-medium text-gray-700"
            >
              Upper Jaw Scan <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="upperJawScan"
              name="upperJawScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="lowerJawScan"
              className="block text-sm font-medium text-gray-700"
            >
              Lower Jaw Scan <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="lowerJawScan"
              name="lowerJawScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="biteScan"
              className="block text-sm font-medium text-gray-700"
            >
              Bite Scan <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="biteScan"
              name="biteScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>
        </>
      )}

      {formData.uploadMethod === 'compressed' && (
        <>
          <Alert
            title="Compressed Archive Requirements"
            description="Upload a single ZIP or RAR file containing all three required scans: Upper Jaw, Lower Jaw, and Bite scans. Please name your files clearly (e.g., upper_jaw.stl, lower_jaw.stl, bite.stl) for easy identification."
          />

          <div>
            <label
              htmlFor="compressedScans"
              className="block text-sm font-medium text-gray-700"
            >
              Compressed Scan Archive <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="compressedScans"
              name="compressedScans"
              accept=".zip,.rar,.7z"
              onChange={handleChange}
              required={formData.uploadMethod === 'compressed'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>
        </>
      )}

      {/* Additional Files - Always Available */}
      <div className="pt-4 border-t border-neutral-border">
        <label
          htmlFor="additionalFiles"
          className="block text-sm font-medium text-gray-700"
        >
          Additional Files (Optional)
        </label>
        <input
          type="file"
          id="additionalFiles"
          name="additionalFiles"
          multiple
          accept=".stl,.obj,.ply,.pdf,.jpg,.png"
          onChange={handleChange}
          className="mt-1 block w-full text-sm text-gray-500
          file:mr-4 file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-sky-50 file:text-sky-700
          hover:file:bg-sky-100"
        />
        {formData.additionalFiles.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {formData.additionalFiles.length} file(s) selected
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
