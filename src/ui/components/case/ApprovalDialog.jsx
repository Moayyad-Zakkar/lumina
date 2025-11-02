import React, { useState, useEffect } from 'react';
import {
  FeatherCheck,
  FeatherAlertTriangle,
  FeatherRefreshCw,
  FeatherMessageCircle,
  FeatherX,
  FeatherChevronDown,
  FeatherChevronUp,
} from '@subframe/core';
import { Button } from '../Button';
import RadioGroup from '../RadioGroup';
import { Loader } from '../Loader';
import supabase from '../../../helper/supabaseClient';

const ApprovalDialog = ({
  isOpen,
  onClose,
  onConfirmApprove,
  onChangeMaterial,
  onContactSupport,
  saving,
  caseData,
}) => {
  const [showMaterialEdit, setShowMaterialEdit] = useState(false);
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Fetch aligner materials when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchMaterials = async () => {
        setLoadingMaterials(true);
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true);

          if (error) {
            console.error('Error fetching materials:', error);
          } else {
            const materials = data.filter(
              (item) => item.type === 'aligners_material'
            );
            setAlignerMaterials(materials);
          }
        } catch (error) {
          console.error('Error fetching materials:', error);
        } finally {
          setLoadingMaterials(false);
        }
      };

      fetchMaterials();
      // Reset state when dialog opens
      setShowMaterialEdit(false);
      setSelectedMaterial(caseData?.aligner_material || '');
    }
  }, [isOpen, caseData?.aligner_material]);

  const handleMaterialChange = (e) => {
    setSelectedMaterial(e.target.value);
  };

  const handleUpdateMaterial = async () => {
    const currentMaterial = caseData?.aligner_material || '';
    const newMaterial = selectedMaterial;

    // Check if material has changed
    const materialChanged = newMaterial !== currentMaterial;

    if (onChangeMaterial) {
      await onChangeMaterial(newMaterial, materialChanged);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog Content */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 ${
          showMaterialEdit ? 'max-w-[640px]' : 'max-w-[520px]'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <FeatherAlertTriangle className="w-5 h-5 text-brand-600" />

            <div className="flex-1">
              <h3 className="text-heading-3 font-heading-3 text-default-font">
                Confirm Treatment Plan Approval
              </h3>
              <p className="mt-1 text-body font-body text-subtext-color">
                Please review your options before proceeding with the treatment
                plan.
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FeatherX className="w-6 h-6" />
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Approve Option */}
            <div className="border border-neutral-border rounded-md p-4 hover:bg-neutral-50 transition-colors">
              <div className="flex items-start gap-3">
                <FeatherCheck className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-body-bold font-body-bold text-default-font">
                    Approve Treatment Plan
                  </h4>
                  <p className="text-body font-body text-subtext-color mt-1">
                    Proceed with the current treatment plan. Production will
                    begin once approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Change Material Option */}
            <div className="border border-neutral-border rounded-md p-4">
              <div
                className="flex items-start gap-3 cursor-pointer hover:bg-neutral-50 -m-4 p-4 rounded-md transition-colors"
                onClick={() => setShowMaterialEdit(!showMaterialEdit)}
              >
                <FeatherRefreshCw className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-body-bold font-body-bold text-default-font">
                      Change Aligner Material
                    </h4>
                    {showMaterialEdit ? (
                      <FeatherChevronUp className="w-5 h-5 text-subtext-color" />
                    ) : (
                      <FeatherChevronDown className="w-5 h-5 text-subtext-color" />
                    )}
                  </div>
                  <p className="text-body font-body text-subtext-color mt-1">
                    Select a different aligner material. Your case will be
                    re-evaluated by 3DA.
                  </p>
                </div>
              </div>

              {/* Material Selection (collapsible) */}
              {showMaterialEdit && (
                <div className="mt-4 pt-4 border-t border-neutral-border">
                  {loadingMaterials ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader size="small" />
                    </div>
                  ) : alignerMaterials.length > 0 ? (
                    <RadioGroup
                      label="Select Aligner Material"
                      name="alignerMaterial"
                      options={alignerMaterials.map((mat) => ({
                        label: mat.name,
                        value: mat.name,
                      }))}
                      selectedValue={selectedMaterial}
                      onChange={handleMaterialChange}
                    />
                  ) : (
                    <p className="text-body font-body text-subtext-color">
                      No materials available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Contact Support Option */}
            <div className="border border-neutral-border rounded-md p-4 hover:bg-neutral-50 transition-colors">
              <div className="flex items-start gap-3">
                <FeatherMessageCircle className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-body-bold font-body-bold text-default-font">
                    Contact 3DA Support
                  </h4>
                  <p className="text-body font-body text-subtext-color mt-1">
                    Have questions? Reach out to our team for more information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-4 pt-4 border-t border-neutral-border">
            <Button
              variant="neutral-secondary"
              icon={<FeatherMessageCircle />}
              onClick={onContactSupport}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Contact Support
            </Button>
            {showMaterialEdit && selectedMaterial ? (
              <Button
                variant="neutral-secondary"
                icon={<FeatherRefreshCw />}
                onClick={handleUpdateMaterial}
                disabled={
                  saving || selectedMaterial === caseData?.aligner_material
                }
                className="w-full sm:w-auto"
              >
                {saving ? 'Updating...' : 'Update Material'}
              </Button>
            ) : (
              <Button
                variant="neutral-secondary"
                icon={<FeatherRefreshCw />}
                onClick={() => setShowMaterialEdit(true)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Change Material
              </Button>
            )}
            <Button
              icon={<FeatherCheck />}
              onClick={onConfirmApprove}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Approving...' : 'Approve Plan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDialog;
