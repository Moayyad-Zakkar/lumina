import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import Error from '../components/Error';
import SuccessMessage from '../components/SuccessMessage';
import DentalChart from '../components/DentalChart';

// Import refactored components
import PatientInformationForm from '../components/case/PatientInformationForm';
import TreatmentOptionsForm from '../components/case/TreatmentOptionsForm';
import DiagnosisForm from '../components/case/DiagnosisForm';
import FileUploadSection from '../components/case/FileUploadSection';

const CaseSubmitRefactored = () => {
  const [alignerMaterials, setAlignerMaterials] = useState([]);
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
        <PatientInformationForm
          formData={formData}
          handleChange={handleChange}
          getMinDate={getMinDate}
        />

        <TreatmentOptionsForm
          formData={formData}
          handleChange={handleChange}
          alignerMaterials={alignerMaterials}
        />

        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div>
            <DentalChart initialStatus={{}} onChange={setToothStatus} />
          </div>
        </div>

        <DiagnosisForm formData={formData} handleChange={handleChange} />

        <FileUploadSection formData={formData} handleChange={handleChange} />

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

export default CaseSubmitRefactored;
