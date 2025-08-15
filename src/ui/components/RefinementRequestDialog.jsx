import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { Alert } from './Alert';
import { FeatherX, FeatherCheck } from '@subframe/core';
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

const RefinementRequestDialog = ({
  isOpen,
  onClose,
  caseData,
  onRefinementSubmitted,
}) => {
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      setStep(1);
      setFormData({
        reason: '',
        alignerMaterial: '',
        printingMethod: '',
        upperJawScan: null,
        lowerJawScan: null,
        biteScan: null,
        additionalFiles: [],
      });
    }
  }, [isOpen]);

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

  const handleSubmit = async () => {
    if (step === 1) {
      if (!formData.reason.trim()) {
        setError('Please provide a reason for the refinement request');
        return;
      }
      setStep(2);
      setError(null);
      return;
    }

    if (step === 2) {
      if (!formData.alignerMaterial || !formData.printingMethod) {
        setError('Please select both aligner material and printing method');
        return;
      }
      setStep(3);
      setError(null);
      return;
    }

    if (step === 3) {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error: insertError } = await supabase
          .from('refinement_requests')
          .insert({
            case_id: caseData.id,
            user_id: user.id,
            aligner_material: formData.alignerMaterial,
            printing_method: formData.printingMethod,
            reason: formData.reason,
            status: 'pending',
          });

        if (insertError) throw insertError;

        toast.success('Refinement request submitted successfully!');
        onRefinementSubmitted();
        onClose();
      } catch (error) {
        console.error('Submit error:', error);
        setError(error.message || 'Failed to submit refinement request');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setStep(1);
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
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert
              title="Refinement Request"
              description="Please provide a detailed reason for requesting refinement of your treatment plan."
            />
            <TextArea label="Reason for Refinement" name="reason">
              <TextArea.Input
                className="h-auto min-h-[96px] w-full flex-none"
                placeholder="Describe why you need refinement (e.g., treatment not progressing as expected, new concerns, etc.)"
                value={formData.reason}
                onChange={handleChange}
              />
            </TextArea>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Alert
              title="Treatment Options"
              description="Select your preferred aligner material and printing method for the refinement."
            />
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Alert
              title="New Scans Required"
              description="Please upload new scans for the refinement treatment plan."
            />
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content className="p-6 max-w-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-heading-3 font-heading-3 text-default-font">
              Request Refinement - Step {step} of 3
            </h2>
          </div>
          {/*<Button
            variant="neutral-tertiary"
            size="small"
            onClick={handleClose}
            icon={<FeatherX />}
          />*/}
        </div>

        {error && (
          <Alert
            variant="destructive"
            title="Error"
            description={error}
            className="mb-4"
          />
        )}

        {renderStepContent()}

        <div className="flex items-center justify-between mt-6">
          <div className="flex space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-3 h-3 rounded-full ${
                  stepNumber <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="neutral-secondary"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              icon={step === 3 ? <FeatherCheck /> : undefined}
            >
              {loading
                ? 'Submitting...'
                : step === 3
                ? 'Submit Request'
                : 'Next'}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default RefinementRequestDialog;
