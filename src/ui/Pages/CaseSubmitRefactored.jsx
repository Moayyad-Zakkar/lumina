import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import supabase from '../../helper/supabaseClient';
import { uploadFile } from '../../helper/storageUtils';
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
import { useUserRole } from '../../helper/useUserRole';

const CaseSubmitRefactored = () => {
  const { t } = useTranslation();
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [toothStatus, setToothStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  //for more accurate role check, but no need i think as this page isn't for admins!
  /*
  const { role, loading: roleLoading } = useUserRole();
  const isAdmin = role === 'admin';
*/
  const [formData, setFormData] = useState({
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
    chiefComplaint: '',
    userNote: '',
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

      if (name === 'uploadMethod' && value === 'compressed') {
        setFormData((prevData) => ({
          ...prevData,
          upperJawScan: null,
          lowerJawScan: null,
          biteScan: null,
        }));
      }

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
      let upperJawScanPath = null;
      let lowerJawScanPath = null;
      let biteScanPath = null;
      let compressedScansPath = null;
      let additionalFilesPaths = [];

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t('caseSubmit.errors.authRequired'));
      }

      // Fetch doctor's profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, clinic')
        .eq('id', user.id)
        .single();

      const doctorName =
        profileData?.full_name || user.email || t('caseSubmit.unknownDoctor');
      const clinicName = profileData?.clinic || null;

      // Comprehensive validation
      const validateSubmission = () => {
        const errors = [];

        // Basic info (Always required)
        if (!formData.firstName?.trim())
          errors.push(t('caseSubmit.errors.firstNameRequired'));
        if (!formData.lastName?.trim())
          errors.push(t('caseSubmit.errors.lastNameRequired'));

        // Diagnosis Validation (Skipped for Admins)
        if (!isAdmin) {
          if (!formData.upperMidline)
            errors.push(t('caseSubmit.errors.upperMidlineRequired'));
          if (!formData.lowerMidline)
            errors.push(t('caseSubmit.errors.lowerMidlineRequired'));
          if (!formData.canineRightClass)
            errors.push(t('caseSubmit.errors.canineRightRequired'));
          if (!formData.canineLeftClass)
            errors.push(t('caseSubmit.errors.canineLeftRequired'));
          if (!formData.molarRightClass)
            errors.push(t('caseSubmit.errors.molarRightRequired'));
          if (!formData.molarLeftClass)
            errors.push(t('caseSubmit.errors.molarLeftRequired'));
          if (!formData.treatmentArch)
            errors.push(t('caseSubmit.errors.treatmentArchRequired'));

          // Conditional shift amount validation
          if (
            ['shifted_right', 'shifted_left'].includes(formData.upperMidline) &&
            !formData.upperMidlineShift
          ) {
            errors.push(t('caseSubmit.errors.upperShiftRequired'));
          }
        }

        // File Uploads (Always required)
        if (formData.uploadMethod === 'individual') {
          if (!formData.upperJawScan || !formData.lowerJawScan) {
            errors.push(t('caseSubmit.errors.scansRequired'));
          }
        }

        return errors;
      };

      const validationErrors = validateSubmission();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const uploadFileWithErrorHandling = async (
        file,
        folderPath,
        metadata = {}
      ) => {
        if (!file) return null;

        try {
          const maxFileSize = 100 * 1024 * 1024; // 100MB
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
            caseId: metadata.caseId || `CASE-${Date.now()}`,
            patientName: metadata.patientName || t('caseSubmit.unknownPatient'),
            fileType: metadata.fileType || folderPath,
            doctorName: metadata.doctorName || 'N/A',
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

      const patientName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const caseId = `CASE-${user.id.substring(0, 8)}-${Date.now()}`;

      if (formData.uploadMethod === 'individual') {
        //console.log('📤 Starting individual file uploads...');

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
        chief_complaint: formData.chiefComplaint?.trim() || null,
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
      };

      const { error: insertError } = await supabase
        .from('cases')
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }

      setSuccessMessage(t('caseSubmit.success.submitted'));
      navigate('/app/cases');
    } catch (error) {
      console.error('Submit error:', error);
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
          <Link to="/app/cases">
            <Breadcrumbs.Item>{t('navigation.cases')}</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>
            {t('caseSubmit.newCase')}
          </Breadcrumbs.Item>
        </Breadcrumbs>
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('caseSubmit.title')}
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
        <DiagnosisForm
          formData={formData}
          handleChange={handleChange}
          isAdmin={false}
        />
        {/* Dental Chart */}
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t('casePage.dentalChart')}
          </span>
          <div className="flex w-full justify-center">
            <DentalChart initialStatus={{}} onChange={setToothStatus} />
          </div>
        </div>

        <FileUploadSection formData={formData} handleChange={handleChange} />

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

export default CaseSubmitRefactored;
