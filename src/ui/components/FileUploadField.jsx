import React from 'react';

const FileUploadField = ({ 
  label, 
  name, 
  accept, 
  onChange, 
  disabled = false,
  required = false,
  multiple = false 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
      />
    </div>
  );
};

export default FileUploadField;