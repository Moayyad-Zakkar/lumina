import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { TextArea } from './TextArea';
import { Alert } from './Alert';
import { FeatherPlus, FeatherX, FeatherCheck } from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';

const RadioGroup = ({ label, name, options, selectedValue, onChange }) => {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-body-bold font-body-bold text-default-font mb-2">
        {label}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer text-body font-body text-default-font"
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

const RefinementSection = ({ caseData }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [methods, setMethods] = useState([]);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    reason: '',
    alignerMaterial: '',
    printingMethod: '',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    additionalFiles: [],
  });

  const canRequestRefinement = ['delivered', 'completed'].includes(
    caseData?.status
  );

  useEffect(() => {
    if (isDialogOpen) {
      fetchServices();
    }
  }, [isDialogOpen]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setAlignerMaterials(
        data.filter((item) => item.type === 'aligners_material')
      );
      setMethods(data.filter((item) => item.type === 'printing_method'));
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load service options');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleReasonChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      reason: e.target.value,
    }));
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxFileSize) {
        throw new Error(`File is too large. Maximum size is 50MB.`);
      }

      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('case-files').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.reason.trim()) {
      setError('Please provide a reason for the refinement request');
      return;
    }
    if (!formData.alignerMaterial || !formData.printingMethod) {
      setError('Please select both aligner material and printing method');
      return;
    }
    if (
      !formData.upperJawScan ||
      !formData.lowerJawScan ||
      !formData.biteScan
    ) {
      setError('Please upload all required scan files');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload files
      const [
        upperJawScanUrl,
        lowerJawScanUrl,
        biteScanUrl,
        additionalFilesUrls,
      ] = await Promise.all([
        uploadFile(formData.upperJawScan, 'refinement-scans/upper-jaw'),
        uploadFile(formData.lowerJawScan, 'refinement-scans/lower-jaw'),
        uploadFile(formData.biteScan, 'refinement-scans/bite'),
        Promise.all(
          (formData.additionalFiles || []).map((file, index) =>
            uploadFile(file, `refinement-scans/additional/${index}`)
          )
        ),
      ]);

      // Create new refinement case directly
      const { error: insertError } = await supabase.from('cases').insert({
        user_id: user.id,
        first_name: caseData.first_name,
        last_name: caseData.last_name,
        aligner_material: formData.alignerMaterial,
        printing_method: formData.printingMethod,
        parent_case_id: caseData.id,
        refinement_number: 1, // You might want to calculate this based on existing refinements
        refinement_reason: formData.reason,
        upper_jaw_scan_url: upperJawScanUrl,
        lower_jaw_scan_url: lowerJawScanUrl,
        bite_scan_url: biteScanUrl,
        additional_files_urls: additionalFilesUrls || [],
        status: 'submitted', // Starts as submitted, admin will review
      });

      if (insertError) throw insertError;

      toast.success('Refinement case submitted successfully!');
      setIsDialogOpen(false);
      setFormData({
        reason: '',
        alignerMaterial: '',
        printingMethod: '',
        upperJawScan: null,
        lowerJawScan: null,
        biteScan: null,
        additionalFiles: [],
      });
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to submit refinement case');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      reason: '',
      alignerMaterial: '',
      printingMethod: '',
      upperJawScan: null,
      lowerJawScan: null,
      biteScan: null,
      additionalFiles: [],
    });
    setIsDialogOpen(false);
  };

  if (!canRequestRefinement) {
    return null;
  }

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <span className="text-heading-3 font-heading-3 text-default-font">
          Request Refinement
        </span>
        <p className="text-body font-body text-subtext-color">
          If you need additional aligners or treatment adjustments, you can
          request a refinement of your treatment plan.
        </p>
        <Button
          onClick={() => setIsDialogOpen(true)}
          icon={<FeatherPlus />}
          className="w-auto"
        >
          Request Refinement
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <Dialog.Content className="p-6 max-w-2xl">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-heading-3 font-heading-3 text-default-font">
              Request Refinement
            </h2>
            <Button
              variant="neutral-tertiary"
              size="small"
              onClick={handleClose}
              icon={<FeatherX />}
            />
          </div>

          <Alert
            title="Refinement Process"
            description="Your refinement request will be reviewed by our team. We will contact you with pricing and treatment details."
            className="mb-4"
          />

          {error && (
            <Alert
              variant="destructive"
              title="Error"
              description={error}
              className="mb-4"
            />
          )}

          <div className="space-y-6">
            <TextArea
              label="Reason for Refinement"
              variant="outline"
              name="reason"
              required
            >
              <TextArea.Input
                placeholder="Please describe why you need refinement (e.g., treatment not progressing as expected, new concerns, etc.)"
                value={formData.reason}
                onChange={handleReasonChange}
              />
            </TextArea>

            <RadioGroup
              label="Preferred Aligner Material"
              name="alignerMaterial"
              options={alignerMaterials.map((mat) => ({
                label: `${mat.name} (${mat.price}$/aligner)`,
                value: mat.name,
              }))}
              selectedValue={formData.alignerMaterial}
              onChange={handleChange}
            />

            <RadioGroup
              label="Preferred Printing Method"
              name="printingMethod"
              options={methods.map((m) => ({
                label: `${m.name} (${
                  m.price ? `$${m.price}/model` : 'No price'
                })`,
                value: m.name,
              }))}
              selectedValue={formData.printingMethod}
              onChange={handleChange}
            />

            <div className="space-y-4">
              <h3 className="text-body-bold font-body-bold text-default-font">
                New Scans Required *
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upper Jaw Scan *
                  </label>
                  <input
                    type="file"
                    name="upperJawScan"
                    accept=".stl,.obj,.ply"
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lower Jaw Scan *
                  </label>
                  <input
                    type="file"
                    name="lowerJawScan"
                    accept=".stl,.obj,.ply"
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bite Scan *
                  </label>
                  <input
                    type="file"
                    name="biteScan"
                    accept=".stl,.obj,.ply"
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Files (Optional)
                  </label>
                  <input
                    type="file"
                    name="additionalFiles"
                    multiple
                    accept=".stl,.obj,.ply,.pdf,.jpg,.png"
                    onChange={handleChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <Button
              variant="neutral-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              icon={<FeatherCheck />}
            >
              {loading ? 'Submitting...' : 'Submit Refinement Request'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
};

export default RefinementSection;
