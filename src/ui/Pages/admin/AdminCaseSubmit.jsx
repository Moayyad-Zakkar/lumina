import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next'; // Import i18next
import supabase from '../../../helper/supabaseClient';
import { uploadFile } from '../../../helper/storageUtils';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { TextField } from '../../components/TextField';

import { Button } from '../../components/Button';
import Error from '../../components/Error';
import SuccessMessage from '../../components/SuccessMessage';
import DentalChart from '../../components/DentalChart';
import { FeatherEraser } from '@subframe/core';

// Import sub-components (Ensure paths are correct relative to this file)
import PatientInformationForm from '../../components/case/PatientInformationForm';
import TreatmentOptionsForm from '../../components/case/TreatmentOptionsForm';
import DiagnosisForm from '../../components/case/DiagnosisForm';
import FileUploadSection from '../../components/case/FileUploadSection';

const AdminCaseSubmit = () => {
  const { t } = useTranslation(); // Initialize translation
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [toothStatus, setToothStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    selectedUserId: '',
    selectedUserName: '',
    firstName: '',
    lastName: '',
    isUrgent: false,
    urgentDeliveryDate: '',
    alignerMaterial: '',
    uploadMethod: 'individual',
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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else {
        setAlignerMaterials(
          servicesData.filter((item) => item.type === 'aligners_material')
        );
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        setUsers(usersData || []);
        setFilteredUsers(usersData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Handle user search
  useEffect(() => {
    if (userSearchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) => {
        const fullName = user?.full_name?.toLowerCase();
        const email = user?.email?.toLowerCase();
        const query = userSearchQuery.toLowerCase();
        return fullName?.includes(query) || email?.includes(query);
      });
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, users]);

  const handleUserSearch = (e) => {
    setUserSearchQuery(e.target.value);
    setShowUserDropdown(true);
  };

  const handleUserSelect = (user) => {
    setFormData((prev) => ({
      ...prev,
      selectedUserId: user.id,
      selectedUserName: `${user.full_name} (${user.email})`,
    }));
    setUserSearchQuery(`${user.full_name} (${user.email})`);
    setShowUserDropdown(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (files) {
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else if (type === 'checkbox') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
        ...(name === 'isUrgent' && !checked ? { urgentDeliveryDate: '' } : {}),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      // Logic for clearing dependent fields
      if (name === 'upperMidline' && value === 'centered') {
        setFormData((prevData) => ({ ...prevData, upperMidlineShift: '' }));
      }
      if (name === 'lowerMidline' && value === 'centered') {
        setFormData((prevData) => ({ ...prevData, lowerMidlineShift: '' }));
      }
      if (name === 'uploadMethod' && value === 'compressed') {
        setFormData((prevData) => ({
          ...prevData,
          upperJawScan: null,
          lowerJawScan: null,
          biteScan: null,
        }));
      }
      if (name === 'uploadMethod' && value === 'individual') {
        setFormData((prevData) => ({ ...prevData, compressedScans: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let upperJawScanPath = null;
      let lowerJawScanPath = null;
      let biteScanPath = null;
      let compressedScansPath = null;
      let additionalFilesPaths = [];

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error(t('caseSubmit.errors.authRequired'));
      }

      // --- ADMIN SPECIFIC VALIDATION ---
      // Requirement: Only Doctor, First Name, Last Name are required.
      const validateSubmission = () => {
        const errors = [];

        if (!formData.selectedUserId) {
          errors.push(t('adminCaseSubmit.errors.doctorRequired'));
        }
        if (!formData.firstName?.trim()) {
          errors.push(t('caseSubmit.errors.firstNameRequired'));
        }
        if (!formData.lastName?.trim()) {
          errors.push(t('caseSubmit.errors.lastNameRequired'));
        }
        // Urgent date is logic-dependent, so we keep this check
        if (formData.isUrgent && !formData.urgentDeliveryDate) {
          errors.push(t('caseSubmit.errors.deliveryDateRequired'));
        }
        if (formData.isUrgent && formData.urgentDeliveryDate) {
          const deliveryDate = new Date(formData.urgentDeliveryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deliveryDate <= today) {
            errors.push(t('caseSubmit.errors.deliveryDateFuture'));
          }
        }
        // NOTE: File validations and Treatment Options are REMOVED for Admin

        return errors;
      };

      const validationErrors = validateSubmission();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Fetch doctor's profile for metadata
      const { data: doctorProfileData } = await supabase
        .from('profiles')
        .select('full_name, clinic')
        .eq('id', formData.selectedUserId)
        .single();

      const doctorName =
        doctorProfileData?.full_name ||
        formData.selectedUserName ||
        t('caseSubmit.unknownDoctor');
      const clinicName = doctorProfileData?.clinic || null;

      const patientName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const caseId = `ADMIN-${formData.selectedUserId.substring(
        0,
        8
      )}-${Date.now()}`;

      // Reusable upload function
      const uploadFileWithErrorHandling = async (
        file,
        folderPath,
        metadata = {}
      ) => {
        if (!file) return null; // Logic to skip if file not present

        try {
          // Keep file size/type validation if file exists
          const maxFileSize = 100 * 1024 * 1024;
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
            throw new Error(t('caseSubmit.errors.fileTooLarge'));
          }
          const fileExt = file.name.split('.').pop().toLowerCase();
          if (!allowedFileTypes.includes(`.${fileExt}`)) {
            throw new Error(
              t('caseSubmit.errors.invalidFileType', {
                types: allowedFileTypes.join(', '),
              })
            );
          }

          const result = await uploadFile(file, folderPath, {
            caseId: metadata.caseId || `ADMIN-${Date.now()}`,
            patientName: metadata.patientName || t('caseSubmit.unknownPatient'),
            doctorName: metadata.doctorName || t('caseSubmit.unknownDoctor'),
            clinicName: metadata.clinicName || null,
            fileType: metadata.fileType || folderPath,
          });

          if (!result.success) {
            throw new Error(
              result.error || t('caseSubmit.errors.uploadFailed')
            );
          }
          return result.filePath;
        } catch (error) {
          console.error(`Upload error for ${folderPath}:`, error);
          throw error;
        }
      };

      // Uploads (will simply skip if files are null)
      if (formData.uploadMethod === 'individual') {
        const uploadResults = await Promise.all([
          uploadFileWithErrorHandling(
            formData.upperJawScan,
            'upper-jaw-scans',
            {
              caseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.upperJawScan'),
            }
          ),
          uploadFileWithErrorHandling(
            formData.lowerJawScan,
            'lower-jaw-scans',
            {
              caseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.lowerJawScan'),
            }
          ),
          uploadFileWithErrorHandling(formData.biteScan, 'bite-scans', {
            caseId,
            patientName,
            doctorName,
            clinicName,
            fileType: t('caseSubmit.biteScan'),
          }),
        ]);
        [upperJawScanPath, lowerJawScanPath, biteScanPath] = uploadResults;
      } else if (formData.uploadMethod === 'compressed') {
        compressedScansPath = await uploadFileWithErrorHandling(
          formData.compressedScans,
          'compressed-scans',
          {
            caseId,
            patientName,
            doctorName,
            clinicName,
            fileType: t('caseSubmit.compressedScans'),
          }
        );
      }

      if (formData.additionalFiles && formData.additionalFiles.length > 0) {
        additionalFilesPaths = await Promise.all(
          formData.additionalFiles.map((file, index) =>
            uploadFileWithErrorHandling(file, 'additional-files', {
              caseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.additionalFile', { number: index + 1 }),
            })
          )
        );
      }

      const insertPayload = {
        user_id: formData.selectedUserId,
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
        created_by_admin: true,
        admin_id: currentUser.id,
      };

      const { error: insertError } = await supabase
        .from('cases')
        .insert(insertPayload);

      if (insertError) {
        console.error('Case direct insert error:', insertError);
        throw insertError;
      }

      setSuccessMessage(t('adminCaseSubmit.alerts.success'));
      navigate('/admin/cases');
    } catch (error) {
      console.error('Comprehensive submit error:', error);
      setError(error.message || t('caseSubmit.errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/admin/cases">
            <Breadcrumbs.Item>{t('navigation.cases')}</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>
            {t('caseSubmit.newCase')}
          </Breadcrumbs.Item>
        </Breadcrumbs>
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('adminCaseSubmit.title')}
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-start gap-6"
      >
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          {/* Doctor Selection (Kept in main file as it is Admin specific) */}
          <div className="w-full">
            <div className="relative" ref={dropdownRef}>
              <TextField
                className="h-auto w-full flex-none"
                label={t('adminCaseSubmit.selectDoctor.label')}
                helpText={t('adminCaseSubmit.selectDoctor.helpText')}
              >
                <div className="relative w-full h-full">
                  <TextField.Input
                    placeholder={t('adminCaseSubmit.selectDoctor.placeholder')}
                    type="text"
                    value={userSearchQuery}
                    onChange={handleUserSearch}
                    onFocus={() => setShowUserDropdown(true)}
                    required
                    className="pr-8"
                  />

                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchQuery('');
                        setShowUserDropdown(false);
                      }}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <FeatherEraser />
                    </button>
                  )}
                </div>
              </TextField>

              {showUserDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {t('adminCaseSubmit.selectDoctor.noResults')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refactored Forms */}
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
            {t('casePage.dentalChart')}
          </span>
          <div className="flex w-full justify-center">
            <DentalChart initialStatus={{}} onChange={setToothStatus} />
          </div>
        </div>

        <DiagnosisForm
          formData={formData}
          handleChange={handleChange}
          isAdmin={true}
        />

        {/* Note: Passing isRequired={false} to make file uploads optional for Admin */}
        <FileUploadSection
          formData={formData}
          handleChange={handleChange}
          isRequired={false}
        />

        {error && <Error error={error} />}
        {successMessage && <SuccessMessage successMessage={successMessage} />}

        <div className="flex w-full items-center gap-2">
          <Button size="large" type="submit" disabled={loading}>
            {loading ? t('caseSubmit.submitting') : t('caseSubmit.submitCase')}
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="neutral-tertiary"
            size="large"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </>
  );
};

export default AdminCaseSubmit;
