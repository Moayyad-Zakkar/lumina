import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { Alert } from './Alert';
import {
  FeatherPlus,
  FeatherX,
  FeatherCheck,
  FeatherStar,
  FeatherRefreshCw,
} from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import { uploadFile } from '../../helper/storageUtils';
import toast from 'react-hot-toast';
import { Loader } from './Loader';
import RadioGroup from './RadioGroup';

const StarRating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110"
        >
          <FeatherStar
            className={`w-8 h-8 ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const RefinementSection = ({ caseData, onCaseUpdate }) => {
  const [isRefinementDialogOpen, setIsRefinementDialogOpen] = useState(false);
  const [isSatisfactionDialogOpen, setIsSatisfactionDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState(null);

  const [refinementFormData, setRefinementFormData] = useState({
    reason: '',
    alignerMaterial: '',
    uploadMethod: 'individual',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    compressedScans: null,
    additionalFiles: [],
  });

  const [satisfactionData, setSatisfactionData] = useState({
    rating: 0,
    message: '',
  });

  const canRequestRefinement = ['delivered'].includes(caseData?.status);

  useEffect(() => {
    if (isRefinementDialogOpen) {
      fetchServices();
      setRefinementFormData({
        reason: '',
        alignerMaterial: '',
        uploadMethod: 'individual',
        upperJawScan: null,
        lowerJawScan: null,
        biteScan: null,
        compressedScans: null,
        additionalFiles: [],
      });
    }
  }, [isRefinementDialogOpen]);

  const fetchServices = async () => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setAlignerMaterials(
        data.filter((item) => item.type === 'aligners_material')
      );
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load service options');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleRefinementChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setRefinementFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else {
      setRefinementFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleRefinementSubmit = async () => {
    // Validate form
    if (!refinementFormData.reason.trim()) {
      setError('Please provide a reason for the refinement request');
      return;
    }
    if (!refinementFormData.alignerMaterial) {
      setError('Please select an aligner material');
      return;
    }

    // Validate files based on upload method
    if (refinementFormData.uploadMethod === 'individual') {
      if (
        !refinementFormData.upperJawScan ||
        !refinementFormData.lowerJawScan ||
        !refinementFormData.biteScan
      ) {
        setError('Please upload all required scan files');
        return;
      }
    } else if (refinementFormData.uploadMethod === 'compressed') {
      if (!refinementFormData.compressedScans) {
        setError('Please upload the compressed scan archive');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let upperJawResult, lowerJawResult, biteScanResult;

      // Upload based on method
      if (refinementFormData.uploadMethod === 'compressed') {
        const compressedResult = await uploadFile(
          refinementFormData.compressedScans,
          'refinement-scans/compressed',
          {
            caseId: caseData.id,
            patientName: `${caseData.first_name} ${caseData.last_name}`,
            fileType: 'compressed-scans',
          }
        );

        if (!compressedResult.success) {
          throw new Error('Failed to upload compressed scan file');
        }

        // Store the compressed file path in all three fields
        upperJawResult = lowerJawResult = biteScanResult = compressedResult;
      } else {
        // Individual file uploads
        const uploadPromises = [
          uploadFile(
            refinementFormData.upperJawScan,
            'refinement-scans/upper-jaw',
            {
              caseId: caseData.id,
              patientName: `${caseData.first_name} ${caseData.last_name}`,
              fileType: 'upper-jaw-scan',
            }
          ),
          uploadFile(
            refinementFormData.lowerJawScan,
            'refinement-scans/lower-jaw',
            {
              caseId: caseData.id,
              patientName: `${caseData.first_name} ${caseData.last_name}`,
              fileType: 'lower-jaw-scan',
            }
          ),
          uploadFile(refinementFormData.biteScan, 'refinement-scans/bite', {
            caseId: caseData.id,
            patientName: `${caseData.first_name} ${caseData.last_name}`,
            fileType: 'bite-scan',
          }),
        ];

        [upperJawResult, lowerJawResult, biteScanResult] = await Promise.all(
          uploadPromises
        );

        if (
          !upperJawResult.success ||
          !lowerJawResult.success ||
          !biteScanResult.success
        ) {
          throw new Error('Failed to upload one or more scan files');
        }
      }

      // Upload additional files if any
      const additionalFilesPromises = (
        refinementFormData.additionalFiles || []
      ).map((file) =>
        uploadFile(file, 'refinement-scans/additional', {
          caseId: caseData.id,
          patientName: `${caseData.first_name} ${caseData.last_name}`,
          fileType: 'additional-file',
        })
      );

      const additionalResults = await Promise.all(additionalFilesPromises);

      const additionalFilesUrls = additionalResults
        .filter((result) => result.success)
        .map((result) => result.filePath);

      // Create new refinement case
      const { error: insertError } = await supabase.from('cases').insert({
        user_id: user.id,
        first_name: caseData.first_name,
        last_name: caseData.last_name,
        aligner_material: refinementFormData.alignerMaterial,
        parent_case_id: caseData.id,
        refinement_number: 1,
        refinement_reason: refinementFormData.reason,
        upload_method: refinementFormData.uploadMethod,
        upper_jaw_scan_url: upperJawResult.filePath,
        lower_jaw_scan_url: lowerJawResult.filePath,
        bite_scan_url: biteScanResult.filePath,
        additional_files_urls: additionalFilesUrls,
        status: 'submitted',
      });

      if (insertError) throw insertError;

      toast.success('Refinement case submitted successfully!');
      setIsRefinementDialogOpen(false);

      if (onCaseUpdate) onCaseUpdate();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to submit refinement case');
    } finally {
      setLoading(false);
    }
  };

  const handleSatisfactionSubmit = async () => {
    if (satisfactionData.rating === 0) {
      setError('Please provide a rating');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'completed',
          satisfaction_rating: satisfactionData.rating,
          satisfaction_message: satisfactionData.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      toast.success('Case marked as completed!');
      setIsSatisfactionDialogOpen(false);
      setSatisfactionData({ rating: 0, message: '' });

      if (onCaseUpdate) onCaseUpdate();
    } catch (error) {
      console.error('Error updating case:', error);
      setError(error.message || 'Failed to mark case as completed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefinementClose = () => {
    if (!loading) {
      setError(null);
      setIsRefinementDialogOpen(false);
    }
  };

  const handleSatisfactionClose = () => {
    if (!loading) {
      setError(null);
      setIsSatisfactionDialogOpen(false);
    }
  };

  if (!canRequestRefinement) {
    return null;
  }

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <span className="text-heading-3 font-heading-3 text-default-font">
          Case Actions
        </span>
        <p className="text-body font-body text-subtext-color">
          Mark your case as completed or request a refinement if you need
          additional aligners or treatment adjustments.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setIsSatisfactionDialogOpen(true)}
            icon={<FeatherCheck />}
            className="w-auto"
          >
            Mark as Completed
          </Button>
          <Button
            onClick={() => setIsRefinementDialogOpen(true)}
            icon={<FeatherPlus />}
            variant="neutral-secondary"
            className="w-auto"
          >
            Request Refinement
          </Button>
        </div>
      </div>

      {/* Refinement Dialog */}
      {isRefinementDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleRefinementClose}
          />

          {/* Dialog Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 max-w-[640px] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FeatherRefreshCw className="w-4 h-4 text-brand-600" />
                </div>

                <div className="flex-1">
                  <h3 className="text-heading-3 font-heading-3 text-default-font">
                    Request Refinement
                  </h3>
                  <p className="mt-1 text-body font-body text-subtext-color">
                    Request a refinement of your treatment plan with new scans
                    and updated preferences.
                  </p>
                </div>

                <button
                  onClick={handleRefinementClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <FeatherX className="w-6 h-6" />
                </button>
              </div>

              {/* Info Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-body-bold font-body-bold text-amber-800">
                  ⚠️ Important Information
                </p>
                <p className="text-body font-body text-amber-700 mt-1">
                  Your refinement request will be reviewed by our team. We will
                  contact you with pricing and treatment details.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-body-bold font-body-bold text-red-800">
                    Error
                  </p>
                  <p className="text-body font-body text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              )}

              {/* Reason for Refinement */}
              <div className="border border-neutral-border rounded-md p-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="reason"
                    className="text-body-bold font-body-bold text-default-font"
                  >
                    Reason for Refinement{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-body font-body text-subtext-color -mt-1 mb-2">
                    Please describe why you need refinement (e.g., treatment not
                    progressing as expected, new concerns, etc.)
                  </p>
                  <textarea
                    id="reason"
                    value={refinementFormData.reason}
                    onChange={(e) =>
                      setRefinementFormData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Enter reason for refinement..."
                    rows={4}
                    disabled={loading}
                    className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Aligner Material Selection */}
              <div className="border border-neutral-border rounded-md p-4">
                {loadingMaterials ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader size="small" />
                  </div>
                ) : alignerMaterials.length > 0 ? (
                  <RadioGroup
                    label="Preferred Aligner Material *"
                    name="alignerMaterial"
                    options={alignerMaterials.map((mat) => ({
                      label: `${mat.name} (${mat.price}$/aligner)`,
                      value: mat.name,
                    }))}
                    selectedValue={refinementFormData.alignerMaterial}
                    onChange={handleRefinementChange}
                  />
                ) : (
                  <p className="text-body font-body text-subtext-color">
                    No materials available
                  </p>
                )}
              </div>

              {/* Upload Method Selection */}
              <div className="border border-neutral-border rounded-md p-4">
                <fieldset className="flex flex-col gap-3">
                  <legend className="text-body-bold font-body-bold text-default-font mb-2">
                    Choose Upload Method
                  </legend>
                  <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="individual"
                      checked={refinementFormData.uploadMethod === 'individual'}
                      onChange={handleRefinementChange}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span>Individual Files (Upload each scan separately)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="compressed"
                      checked={refinementFormData.uploadMethod === 'compressed'}
                      onChange={handleRefinementChange}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span>
                      Compressed Archive (Upload all scans in one ZIP/RAR file)
                    </span>
                  </label>
                </fieldset>
              </div>

              {/* File Uploads */}
              <div className="border border-neutral-border rounded-md p-4">
                <h4 className="text-body-bold font-body-bold text-default-font mb-4">
                  New Scans Required *
                </h4>

                {refinementFormData.uploadMethod === 'individual' ? (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                      <p className="text-body font-body text-blue-800">
                        Please upload each scan file separately. Ensure all scan
                        files are in STL, OBJ, or PLY format.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upper Jaw Scan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          name="upperJawScan"
                          accept=".stl,.obj,.ply"
                          onChange={handleRefinementChange}
                          disabled={loading}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lower Jaw Scan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          name="lowerJawScan"
                          accept=".stl,.obj,.ply"
                          onChange={handleRefinementChange}
                          disabled={loading}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bite Scan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          name="biteScan"
                          accept=".stl,.obj,.ply"
                          onChange={handleRefinementChange}
                          disabled={loading}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                      <p className="text-body font-body text-blue-800">
                        Upload a single ZIP or RAR file containing all three
                        required scans: Upper Jaw, Lower Jaw, and Bite scans.
                        Please name your files clearly for easy identification.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compressed Scan Archive{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        name="compressedScans"
                        accept=".zip,.rar,.7z"
                        onChange={handleRefinementChange}
                        disabled={loading}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                      />
                    </div>
                  </>
                )}

                {/* Additional Files */}
                <div className="pt-4 mt-4 border-t border-neutral-border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Files (Optional)
                  </label>
                  <input
                    type="file"
                    name="additionalFiles"
                    multiple
                    accept=".stl,.obj,.ply,.pdf,.jpg,.png"
                    onChange={handleRefinementChange}
                    disabled={loading}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                  />
                  {refinementFormData.additionalFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      {refinementFormData.additionalFiles.length} file(s)
                      selected
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-neutral-border">
                <Button
                  variant="neutral-secondary"
                  onClick={handleRefinementClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="brand-primary"
                  icon={<FeatherCheck />}
                  onClick={handleRefinementSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Refinement Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Dialog */}
      {isSatisfactionDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleSatisfactionClose}
          />

          {/* Dialog Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 max-w-[540px] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FeatherCheck className="w-4 h-4 text-brand-600" />
                </div>

                <div className="flex-1">
                  <h3 className="text-heading-3 font-heading-3 text-default-font">
                    Complete Your Case
                  </h3>
                  <p className="mt-1 text-body font-body text-subtext-color">
                    Please share your experience with us. Your feedback helps us
                    improve our service.
                  </p>
                </div>

                <button
                  onClick={handleSatisfactionClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <FeatherX className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-body-bold font-body-bold text-red-800">
                    Error
                  </p>
                  <p className="text-body font-body text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              )}

              {/* Rating Section */}
              <div className="border border-neutral-border rounded-md p-4">
                <label className="block text-body-bold font-body-bold text-default-font mb-3">
                  How satisfied are you with the treatment?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center">
                  <StarRating
                    rating={satisfactionData.rating}
                    onRatingChange={(rating) =>
                      setSatisfactionData((prev) => ({ ...prev, rating }))
                    }
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="border border-neutral-border rounded-md p-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="satisfactionMessage"
                    className="text-body-bold font-body-bold text-default-font"
                  >
                    Additional Comments (Optional)
                  </label>
                  <p className="text-body font-body text-subtext-color -mt-1 mb-2">
                    Tell us about your experience with the treatment.
                  </p>
                  <textarea
                    id="satisfactionMessage"
                    value={satisfactionData.message}
                    onChange={(e) =>
                      setSatisfactionData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Share your feedback..."
                    rows={4}
                    disabled={loading}
                    className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-neutral-border">
                <Button
                  variant="neutral-secondary"
                  onClick={handleSatisfactionClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="brand-primary"
                  icon={<FeatherCheck />}
                  onClick={handleSatisfactionSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Complete Case'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RefinementSection;
