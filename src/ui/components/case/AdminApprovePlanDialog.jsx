import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherCheck, FeatherX } from '@subframe/core';
import { Button } from '../Button';
import { Loader } from '../Loader';
import supabase from '../../../helper/supabaseClient';

/**
 * AdminApprovePlanDialog
 *
 * A dialog for the admin to pick a material and confirm the final cost
 * before approving a treatment plan on behalf of the doctor.
 */
const AdminApprovePlanDialog = ({
  isOpen,
  onClose,
  onConfirm, // (materialName, alignersPrice, totalCost) => Promise<void>
  caseData,
  isLoading,
}) => {
  const { t } = useTranslation();

  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Fetch materials when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setSelectedMaterial(null);

    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'aligners_material')
          .order('id', { ascending: true });
        if (!error && data) {
          // Only show materials that have a price set by the admin
          setAlignerMaterials(
            data.filter((mat) => caseData?.material_prices?.[mat.name] != null),
          );
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, [isOpen, caseData?.material_prices]);

  if (!isOpen) return null;

  const caseStudyFee = parseFloat(caseData?.case_study_fee || 0);
  const deliveryCharges = parseFloat(caseData?.delivery_charges || 0);

  const getTotal = (materialName) => {
    const alignersPrice = parseFloat(
      caseData?.material_prices?.[materialName] || 0,
    );
    return caseStudyFee + alignersPrice + deliveryCharges;
  };

  const handleConfirm = () => {
    if (!selectedMaterial) return;
    const alignersPrice = parseFloat(
      caseData?.material_prices?.[selectedMaterial] || 0,
    );
    const totalCost = getTotal(selectedMaterial);
    onConfirm(selectedMaterial, alignersPrice, totalCost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-heading-3 font-heading-3 text-default-font">
                {t('adminCasePage.approvePlanDialog.title')}
              </h3>
              <p className="mt-1 text-body font-body text-subtext-color">
                {t('adminCasePage.approvePlanDialog.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FeatherX className="w-5 h-5" />
            </button>
          </div>

          {/* Material list */}
          {loadingMaterials ? (
            <div className="flex items-center justify-center py-6">
              <Loader size="small" />
            </div>
          ) : alignerMaterials.length === 0 ? (
            <p className="text-body font-body text-subtext-color text-center py-4">
              {t('adminCasePage.approvePlanDialog.noPrices')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {alignerMaterials.map((mat) => {
                const alignersPrice = parseFloat(
                  caseData?.material_prices?.[mat.name] || 0,
                );
                const total = getTotal(mat.name);
                const isSelected = selectedMaterial === mat.name;

                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setSelectedMaterial(mat.name)}
                    className={`
                      flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left
                      transition-all duration-150 cursor-pointer outline-none w-full
                      ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                          : 'border-neutral-border bg-white hover:border-neutral-400'
                      }
                    `}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`text-body-bold font-body-bold ${isSelected ? 'text-brand-700' : 'text-default-font'}`}
                      >
                        {mat.name}
                      </span>
                      <span className="text-caption font-caption text-subtext-color mt-1">
                        {t('casePage.treatmentPlan.alignersPrice')}: $
                        {alignersPrice.toFixed(2)}
                        {' · '}
                        {t('casePage.treatmentPlan.caseStudyFee')}: $
                        {caseStudyFee.toFixed(2)}
                        {deliveryCharges > 0 && (
                          <>
                            {' '}
                            · {t('casePage.treatmentPlan.deliveryCharges')}: $
                            {deliveryCharges.toFixed(2)}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                      <span
                        className={`text-heading-3 font-heading-3 ${isSelected ? 'text-brand-600' : 'text-default-font'}`}
                      >
                        ${total.toFixed(2)}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                          <FeatherCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-border">
            <Button
              variant="neutral-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="brand-primary"
              icon={<FeatherCheck />}
              onClick={handleConfirm}
              disabled={isLoading || !selectedMaterial || loadingMaterials}
            >
              {isLoading
                ? t('casePage.dialogs.approval.approving')
                : t('adminCasePage.approvePlanDialog.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovePlanDialog;
