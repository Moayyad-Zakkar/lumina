import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Breadcrumbs } from '../../ui/components/Breadcrumbs';
import { TextField } from '../../ui/components/TextField';

import { Alert } from '../../ui/components/Alert';
import { Button } from '../../ui/components/Button';

import { useEffect } from 'react';
import Error from '../components/Error';
import SuccessMessage from '../components/SuccessMessage';
import DentalChart from '../components/DentalChart';

const RadioGroup = ({ label, name, options, selectedValue, onChange }) => {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-body-bold font-body-bold text-default-font mb-2">
        {label}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer text-body font-body text-default-font group-disabled/0f804ad9:text-subtext-color"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
            className="accent-blue-600"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
};

const CaseSubmit = () => {
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [methods, setMethods] = useState([]);
  const [toothStatus, setToothStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    alignerMaterial: '',
    printingMethod: '',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    toothStatus: {},
    additionalFiles: [],
    userNote: '', // Added note field
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
        return;
      }

      setAlignerMaterials(
        data.filter((item) => item.type === 'aligners_material')
      );
      setMethods(data.filter((item) => item.type === 'printing_method'));

      setLoading(false);
    };

    fetchServices();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Ensure user is authenticated
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User must be authenticated to submit a case');
      }

      // Comprehensive validation
      const validateSubmission = () => {
        const errors = [];

        // Check required personal info
        if (!formData.firstName?.trim()) {
          errors.push('First name is required');
        }
        if (!formData.lastName?.trim()) {
          errors.push('Last name is required');
        }

        // Check required scan files
        const requiredScans = [
          { key: 'upperJawScan', name: 'Upper Jaw Scan' },
          { key: 'lowerJawScan', name: 'Lower Jaw Scan' },
          { key: 'biteScan', name: 'Bite Scan' },
        ];

        requiredScans.forEach((scan) => {
          if (!formData[scan.key]) {
            errors.push(`${scan.name} is required`);
          }
        });

        // Optional: Additional validations
        if (formData.additionalFiles && formData.additionalFiles.length > 5) {
          errors.push('Maximum of 5 additional files allowed');
        }

        return errors;
      };

      const validationErrors = validateSubmission();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // File upload function
      const uploadFileWithErrorHandling = async (file, path) => {
        if (!file) return null;

        try {
          // Validate file type and size
          const maxFileSize = 50 * 1024 * 1024; // 50MB
          const allowedFileTypes = [
            '.stl',
            '.obj',
            '.ply',
            '.pdf',
            '.png',
            '.jpg',
            '.jpeg',
          ];

          if (file.size > maxFileSize) {
            throw new Error(
              `${path} file is too large. Maximum file size is 50MB.`
            );
          }

          const fileExt = file.name.split('.').pop().toLowerCase();
          if (!allowedFileTypes.includes(`.${fileExt}`)) {
            throw new Error(
              `Invalid file type for ${path}. Allowed types are: ${allowedFileTypes.join(
                ', '
              )}`
            );
          }

          // Generate unique filename
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${path}/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('case-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type,
            });

          if (uploadError) {
            console.error(`Upload error for ${path}:`, uploadError);
            throw uploadError;
          }

          return filePath;
        } catch (error) {
          console.error(`Comprehensive upload error for ${path}:`, error);
          throw error;
        }
      };

      // Parallel file uploads with error handling
      const [
        upperJawScanPath,
        lowerJawScanPath,
        biteScanPath,
        additionalFilesPaths,
      ] = await Promise.all([
        uploadFileWithErrorHandling(formData.upperJawScan, 'upper-jaw-scans'),
        uploadFileWithErrorHandling(formData.lowerJawScan, 'lower-jaw-scans'),
        uploadFileWithErrorHandling(formData.biteScan, 'bite-scans'),
        Promise.all(
          (formData.additionalFiles || []).map((file, index) =>
            uploadFileWithErrorHandling(file, `additional-files`)
          )
        ),
      ]);

      // Store file paths and user note in database
      const insertPayload = {
        user_id: user.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        aligner_material: formData.alignerMaterial?.trim() || null,
        printing_method: formData.printingMethod?.trim() || null,
        upper_jaw_scan_url: upperJawScanPath,
        lower_jaw_scan_url: lowerJawScanPath,
        bite_scan_url: biteScanPath,
        additional_files_urls: additionalFilesPaths || [],
        tooth_status: toothStatus,
        user_note: formData.userNote?.trim() || null, // Added user note
        status: 'submitted',
      };

      const { error: insertError } = await supabase
        .from('cases')
        .insert(insertPayload);

      if (insertError) {
        console.error('Case direct insert error:', insertError);
        throw insertError;
      }

      setSuccessMessage('Case submitted successfully!');
      navigate('/app/cases');
    } catch (error) {
      console.error('Comprehensive submit error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/app/cases">
            <Breadcrumbs.Item>Cases</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>New Case</Breadcrumbs.Item>
        </Breadcrumbs>
        <span className="text-heading-2 font-heading-2 text-default-font">
          Submit New Case
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-start gap-6"
      >
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <div className="flex w-full items-start gap-4">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
              <TextField
                className="h-auto w-full flex-none"
                label="First Name"
                helpText=""
              >
                <TextField.Input
                  placeholder="Enter patient's first name"
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </TextField>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
              <TextField
                className="h-auto w-full flex-none"
                label="Last Name"
                helpText=""
              >
                <TextField.Input
                  placeholder="Enter patient's last name"
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </TextField>
            </div>
          </div>

          <div className="flex w-full items-start gap-4">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
              <RadioGroup
                label="Preferred Aligner Material"
                name="alignerMaterial"
                options={alignerMaterials.map((mat) => ({
                  label: `${mat.name} (${mat.price}$/aligner).`,
                  value: mat.name,
                }))}
                selectedValue={formData.alignerMaterial}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex w-full items-start gap-4">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
              <RadioGroup
                label="Preferred Printing Method"
                name="printingMethod"
                options={methods.map((m) => ({
                  label: `${m.name} (${
                    m.price ? `$${m.price}/model` : 'No price'
                  }).`,
                  value: m.name,
                }))}
                selectedValue={formData.printingMethod}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div>
            <DentalChart initialStatus={{}} onChange={setToothStatus} />
          </div>
        </div>

        {/* Added Note Section */}
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Case Notes
          </span>
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="userNote"
                className="text-body-bold font-body-bold text-default-font"
              >
                Additional Notes
              </label>
              <textarea
                id="userNote"
                name="userNote"
                value={formData.userNote}
                onChange={handleChange}
                placeholder="Enter any special instructions, patient history, or additional details..."
                rows={4}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px] placeholder:text-subtext-color"
              />
              <span className="text-caption font-caption text-subtext-color">
                Add any additional information or special instructions for this
                case
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Required Scans
          </span>
          <Alert
            title="File Requirements"
            description="Please ensure all scan files are in STL or PLY format"
          />

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
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
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
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
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
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
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

        {error && <Error error={error} />}
        {successMessage && <SuccessMessage successMessage={successMessage} />}

        <div className="flex w-full items-center gap-2">
          <Button size="large" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Case'}
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="neutral-tertiary"
            size="large"
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
};

export default CaseSubmit;
