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
import RadioGroup from '../components/RadioGroup';

const CaseSubmit = () => {
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  //const [methods, setMethods] = useState([]);
  const [toothStatus, setToothStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    isUrgent: false,
    urgentDeliveryDate: '',
    alignerMaterial: '',
    //printingMethod: '',
    uploadMethod: 'individual', // Default to individual files
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    compressedScans: null,
    toothStatus: {},
    additionalFiles: [],
    userNote: '',
    // Basic Diagnosis fields
    upperMidline: '',
    upperMidlineShift: '',
    lowerMidline: '',
    lowerMidlineShift: '',
    canineRightClass: '',
    canineLeftClass: '',
    molarRightClass: '',
    molarLeftClass: '',
    treatmentArch: '',
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
      //setMethods(data.filter((item) => item.type === 'printing_method'));

      setLoading(false);
    };

    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (files) {
      // Handle file inputs
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else if (type === 'checkbox') {
      // Handle checkbox inputs
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
        // Clear urgent delivery date if urgent is unchecked
        ...(name === 'isUrgent' && !checked ? { urgentDeliveryDate: '' } : {}),
      }));
    } else {
      // Handle text inputs and radio buttons
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      // Clear shift value if midline is centered
      if (name === 'upperMidline' && value === 'centered') {
        setFormData((prevData) => ({
          ...prevData,
          upperMidlineShift: '',
        }));
      }
      if (name === 'lowerMidline' && value === 'centered') {
        setFormData((prevData) => ({
          ...prevData,
          lowerMidlineShift: '',
        }));
      }

      // Clear individual files when switching to compressed method
      if (name === 'uploadMethod' && value === 'compressed') {
        setFormData((prevData) => ({
          ...prevData,
          upperJawScan: null,
          lowerJawScan: null,
          biteScan: null,
        }));
      }

      // Clear compressed file when switching to individual method
      if (name === 'uploadMethod' && value === 'individual') {
        setFormData((prevData) => ({
          ...prevData,
          compressedScans: null,
        }));
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Initialize file path variables at the beginning of try block
      let upperJawScanPath = null;
      let lowerJawScanPath = null;
      let biteScanPath = null;
      let compressedScansPath = null;
      let additionalFilesPaths = [];

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

        // Check urgent delivery date if urgent is checked
        if (formData.isUrgent && !formData.urgentDeliveryDate) {
          errors.push('Delivery date is required for urgent cases');
        }

        // Check if urgent delivery date is in the future
        if (formData.isUrgent && formData.urgentDeliveryDate) {
          const deliveryDate = new Date(formData.urgentDeliveryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deliveryDate <= today) {
            errors.push('Delivery date must be in the future');
          }
        }

        // Check required scan files based on upload method
        if (formData.uploadMethod === 'individual') {
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
        } else if (formData.uploadMethod === 'compressed') {
          if (!formData.compressedScans) {
            errors.push('Compressed scan archive is required');
          }
        }

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
          const maxFileSize = 100 * 1024 * 1024; // 100MB for compressed files
          const allowedFileTypes = [
            '.stl',
            '.obj',
            '.ply',
            '.pdf',
            '.png',
            '.jpg',
            '.jpeg',
            '.zip',
            '.rar',
            '.7z',
          ];

          if (file.size > maxFileSize) {
            throw new Error(
              `${path} file is too large. Maximum file size is 100MB.`
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

      // Handle different upload methods
      if (formData.uploadMethod === 'individual') {
        // Parallel file uploads for individual files
        const uploadResults = await Promise.all([
          uploadFileWithErrorHandling(formData.upperJawScan, 'upper-jaw-scans'),
          uploadFileWithErrorHandling(formData.lowerJawScan, 'lower-jaw-scans'),
          uploadFileWithErrorHandling(formData.biteScan, 'bite-scans'),
        ]);

        [upperJawScanPath, lowerJawScanPath, biteScanPath] = uploadResults;
      } else if (formData.uploadMethod === 'compressed') {
        // Upload compressed file
        compressedScansPath = await uploadFileWithErrorHandling(
          formData.compressedScans,
          'compressed-scans'
        );
      }

      // Upload additional files (always available)
      if (formData.additionalFiles && formData.additionalFiles.length > 0) {
        additionalFilesPaths = await Promise.all(
          formData.additionalFiles.map((file) =>
            uploadFileWithErrorHandling(file, `additional-files`)
          )
        );
      }

      // Store file paths and user note in database
      const insertPayload = {
        user_id: user.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        is_urgent: formData.isUrgent,
        urgent_delivery_date:
          formData.isUrgent && formData.urgentDeliveryDate
            ? formData.urgentDeliveryDate
            : null,
        aligner_material: formData.alignerMaterial?.trim() || null,
        //printing_method: formData.printingMethod?.trim() || null,
        upload_method: formData.uploadMethod,
        upper_jaw_scan_url: upperJawScanPath,
        lower_jaw_scan_url: lowerJawScanPath,
        bite_scan_url: biteScanPath,
        compressed_scans_url: compressedScansPath,
        additional_files_urls: additionalFilesPaths || [],
        tooth_status: toothStatus,
        user_note: formData.userNote?.trim() || null,
        // Basic Diagnosis fields
        upper_midline: formData.upperMidline?.trim() || null,
        upper_midline_shift: formData.upperMidlineShift?.trim() || null,
        lower_midline: formData.lowerMidline?.trim() || null,
        lower_midline_shift: formData.lowerMidlineShift?.trim() || null,
        canine_right_class: formData.canineRightClass?.trim() || null,
        canine_left_class: formData.canineLeftClass?.trim() || null,
        molar_right_class: formData.molarRightClass?.trim() || null,
        molar_left_class: formData.molarLeftClass?.trim() || null,
        treatment_arch: formData.treatmentArch?.trim() || null,
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

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
                label="First Name (required)"
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
                label="Last Name (required)"
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

          {/* Urgent Case Section */}
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isUrgent"
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 accent-sky-600"
              />
              <label
                htmlFor="isUrgent"
                className="text-body-bold font-body-bold text-default-font cursor-pointer"
              >
                Urgent Case
              </label>
            </div>

            {formData.isUrgent && (
              <div className="ml-7 w-full max-w-xs">
                <TextField
                  className="h-auto w-full flex-none"
                  label="Required Delivery Date"
                  helpText="Select the latest acceptable delivery date"
                >
                  <TextField.Input
                    type="date"
                    id="urgentDeliveryDate"
                    name="urgentDeliveryDate"
                    value={formData.urgentDeliveryDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    required={formData.isUrgent}
                    className="text-body font-body"
                  />
                </TextField>
              </div>
            )}

            {formData.isUrgent && (
              <div className="ml-7">
                <Alert
                  title="Urgent Case Notice"
                  description="Urgent cases may incur additional fees and are subject to availability. We'll contact you to confirm the delivery timeline and any extra charges."
                />
              </div>
            )}
          </div>

          {/* Treatment Arch Selection */}
          <div className="w-full">
            <RadioGroup
              label="Treatment Arch"
              name="treatmentArch"
              options={[
                { label: 'Upper arch', value: 'upper' },
                { label: 'Lower arch', value: 'lower' },
                { label: 'Both arches', value: 'both' },
              ]}
              selectedValue={formData.treatmentArch}
              onChange={handleChange}
            />
          </div>

          {/*Aligner Material Selection*/}
          <div className="flex w-full items-start gap-4">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
              <RadioGroup
                label="Preferred Aligner Material"
                name="alignerMaterial"
                options={alignerMaterials.map((mat) => ({
                  //label: `${mat.name} (${mat.price}$/aligner).`,
                  label: `${mat.name}.`,

                  value: mat.name,
                }))}
                selectedValue={formData.alignerMaterial}
                onChange={handleChange}
              />
            </div>
          </div>

          {/*Printing Method Selection*/}
          {/*
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
*/}
        </div>

        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div>
            <DentalChart initialStatus={{}} onChange={setToothStatus} />
          </div>
        </div>

        {/* Basic Diagnosis Section */}
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Basic Diagnosis
          </span>

          {/* Upper Midline */}
          <div className="w-full">
            <div className="flex flex-col gap-4">
              <RadioGroup
                label="Upper Midline"
                name="upperMidline"
                options={[
                  { label: 'Centered', value: 'centered' },
                  { label: 'Shifted right', value: 'shifted_right' },
                  { label: 'Shifted left', value: 'shifted_left' },
                ]}
                selectedValue={formData.upperMidline}
                onChange={handleChange}
              />
              {(formData.upperMidline === 'shifted_right' ||
                formData.upperMidline === 'shifted_left') && (
                <div className="ml-6">
                  <TextField
                    className="h-auto w-48 flex-none"
                    label="Shift Amount"
                    helpText="Enter shift in millimeters"
                  >
                    <TextField.Input
                      placeholder="e.g., 2.5"
                      type="number"
                      step="0.1"
                      id="upperMidlineShift"
                      name="upperMidlineShift"
                      value={formData.upperMidlineShift}
                      onChange={handleChange}
                    />
                  </TextField>
                </div>
              )}
            </div>
          </div>

          {/* Lower Midline */}
          <div className="w-full">
            <div className="flex flex-col gap-4">
              <RadioGroup
                label="Lower Midline"
                name="lowerMidline"
                options={[
                  { label: 'Centered', value: 'centered' },
                  { label: 'Shifted right', value: 'shifted_right' },
                  { label: 'Shifted left', value: 'shifted_left' },
                ]}
                selectedValue={formData.lowerMidline}
                onChange={handleChange}
              />
              {(formData.lowerMidline === 'shifted_right' ||
                formData.lowerMidline === 'shifted_left') && (
                <div className="ml-6">
                  <TextField
                    className="h-auto w-48 flex-none"
                    label="Shift Amount"
                    helpText="Enter shift in millimeters"
                  >
                    <TextField.Input
                      placeholder="e.g., 1.8"
                      type="number"
                      step="0.1"
                      id="lowerMidlineShift"
                      name="lowerMidlineShift"
                      value={formData.lowerMidlineShift}
                      onChange={handleChange}
                    />
                  </TextField>
                </div>
              )}
            </div>
          </div>

          {/* Canine Relationship */}
          <div className="w-full">
            <span className="text-body-bold font-body-bold text-default-font mb-4 block">
              Canine Relationship
            </span>
            <div className="flex gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-body font-body text-default-font">
                  Right Side
                </span>
                <select
                  name="canineRightClass"
                  value={formData.canineRightClass}
                  onChange={handleChange}
                  className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select class</option>
                  <option value="class_i">Class I</option>
                  <option value="class_ii">Class II</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-body font-body text-default-font">
                  Left Side
                </span>
                <select
                  name="canineLeftClass"
                  value={formData.canineLeftClass}
                  onChange={handleChange}
                  className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select class</option>
                  <option value="class_i">Class I</option>
                  <option value="class_ii">Class II</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
            </div>
          </div>

          {/* Molar Relationship */}
          <div className="w-full">
            <span className="text-body-bold font-body-bold text-default-font mb-4 block">
              Molar Relationship
            </span>
            <div className="flex gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-body font-body text-default-font">
                  Right Side
                </span>
                <select
                  name="molarRightClass"
                  value={formData.molarRightClass}
                  onChange={handleChange}
                  className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select class</option>
                  <option value="class_i">Class I</option>
                  <option value="class_ii">Class II</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-body font-body text-default-font">
                  Left Side
                </span>
                <select
                  name="molarLeftClass"
                  value={formData.molarLeftClass}
                  onChange={handleChange}
                  className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select class</option>
                  <option value="class_i">Class I</option>
                  <option value="class_ii">Class II</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
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
                  Compressed Scan Archive{' '}
                  <span className="text-red-500">*</span>
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
                {/*<div className="mt-2 text-sm text-gray-600">
                  <strong>File naming suggestions:</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>upper_jaw.stl or upper.stl</li>
                    <li>lower_jaw.stl or lower.stl</li>
                    <li>bite.stl or bite_scan.stl</li>
                  </ul>
                </div>*/}
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
