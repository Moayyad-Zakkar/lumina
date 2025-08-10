import { useState } from 'react';
import { useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';

const CaseSubmit = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    alignerMaterial: '',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    additionalFiles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      // Handle file inputs
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else {
      // Handle text inputs and radio buttons
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('case-files').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get the current authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User must be authenticated to submit a case');
      }

      // Insert case with explicit user_id
      const { data, error } = await supabase
        .from('cases')
        .insert({
          user_id: user.id, // CRITICAL: Explicitly set user_id
          first_name: formData.firstName,
          last_name: formData.lastName,
          aligner_material: formData.alignerMaterial,
          upper_jaw_scan_url: upperJawScanUrl,
          lower_jaw_scan_url: lowerJawScanUrl,
          bite_scan_url: biteScanUrl,
          additional_files_urls: additionalFilesUrls,
        })
        .select();

      if (error) {
        console.error('Case submission error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Comprehensive submit error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Submit New Case</h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Aligner Material
          </label>
          <div className="space-y-2">
            {['3da elite', '3da auto', '3da lite'].map((material) => (
              <div key={material} className="flex items-center">
                <input
                  type="radio"
                  id={material}
                  name="alignerMaterial"
                  value={material}
                  checked={formData.alignerMaterial === material}
                  onChange={handleChange}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor={material}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {material}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="upperJawScan"
            className="block text-sm font-medium text-gray-700"
          >
            Upper Jaw Scan
          </label>
          <input
            type="file"
            id="upperJawScan"
            name="upperJawScan"
            accept=".stl,.obj,.ply"
            onChange={handleChange}
            required
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="lowerJawScan"
            className="block text-sm font-medium text-gray-700"
          >
            Lower Jaw Scan
          </label>
          <input
            type="file"
            id="lowerJawScan"
            name="lowerJawScan"
            accept=".stl,.obj,.ply"
            onChange={handleChange}
            required
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="biteScan"
            className="block text-sm font-medium text-gray-700"
          >
            Bite Scan
          </label>
          <input
            type="file"
            id="biteScan"
            name="biteScan"
            accept=".stl,.obj,.ply"
            onChange={handleChange}
            required
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        <div>
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
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          {formData.additionalFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              {formData.additionalFiles.length} file(s) selected
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Case'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseSubmit;
