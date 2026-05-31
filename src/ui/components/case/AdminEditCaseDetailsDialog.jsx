import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherSave, FeatherX } from '@subframe/core';
import { Button } from '../Button';
import { Loader } from '../Loader';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

/**
 * AdminEditCaseDetailsDialog
 *
 * Allows the admin to view all case details and edit:
 * aligner material, upper/lower aligners count, treatment duration,
 * case study fee, delivery charges, aligners price, and total cost.
 *
 * Total cost update also writes to approved_total_cost.
 */
const AdminEditCaseDetailsDialog = ({
  isOpen,
  onClose,
  caseData,
  onSaved, // () => void — called after a successful save so parent can refresh
}) => {
  const { t } = useTranslation();

  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [alignerMaterial, setAlignerMaterial] = useState('');
  const [upperJawAligners, setUpperJawAligners] = useState('');
  const [lowerJawAligners, setLowerJawAligners] = useState('');
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState('');
  const [caseStudyFee, setCaseStudyFee] = useState('');
  const [deliveryCharges, setDeliveryCharges] = useState('');
  const [alignersPrice, setAlignersPrice] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Seed state from caseData whenever the dialog opens
  useEffect(() => {
    if (!isOpen || !caseData) return;

    setAlignerMaterial(caseData.aligner_material || '');
    setUpperJawAligners(caseData.upper_jaw_aligners ?? '');
    setLowerJawAligners(caseData.lower_jaw_aligners ?? '');
    setEstimatedDurationMonths(caseData.estimated_duration_months ?? '');
    setCaseStudyFee(
      caseData.case_study_fee != null
        ? parseFloat(caseData.case_study_fee).toFixed(2)
        : '0.00',
    );
    setDeliveryCharges(
      caseData.delivery_charges != null
        ? parseFloat(caseData.delivery_charges).toFixed(2)
        : '0.00',
    );
    setAlignersPrice(
      caseData.aligners_price != null
        ? parseFloat(caseData.aligners_price).toFixed(2)
        : '0.00',
    );
    setTotalCost(
      caseData.total_cost != null
        ? parseFloat(caseData.total_cost).toFixed(2)
        : '0.00',
    );

    // Fetch active aligner materials
    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'aligners_material')
          .order('id', { ascending: true });
        if (!error && data) setAlignerMaterials(data);
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, [isOpen, caseData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedTotal = parseFloat(totalCost || 0);

      const { error } = await supabase
        .from('cases')
        .update({
          aligner_material: alignerMaterial || null,
          upper_jaw_aligners:
            upperJawAligners !== '' ? Number(upperJawAligners) : null,
          lower_jaw_aligners:
            lowerJawAligners !== '' ? Number(lowerJawAligners) : null,
          estimated_duration_months:
            estimatedDurationMonths !== ''
              ? Number(estimatedDurationMonths)
              : null,
          case_study_fee: parseFloat(caseStudyFee || 0),
          delivery_charges: parseFloat(deliveryCharges || 0),
          aligners_price: parseFloat(alignersPrice || 0),
          total_cost: parsedTotal,
          approved_total_cost: parsedTotal,
        })
        .eq('id', caseData.id);

      if (error) throw error;

      toast.success(t('adminEditCaseDetails.toast.saved'));
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.message || t('adminEditCaseDetails.toast.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  // Read-only display helpers
  const patientName =
    `${caseData?.first_name || ''} ${caseData?.last_name || ''}`.trim();
  const doctorName = caseData?.profiles?.full_name || '—';
  const caseId = caseData?.id || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isSaving ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 max-w-[560px] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-heading-3 font-heading-3 text-default-font">
                {t('adminEditCaseDetails.title')}
              </h3>
              <p className="mt-1 text-body font-body text-subtext-color">
                {t('adminEditCaseDetails.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FeatherX className="w-5 h-5" />
            </button>
          </div>

          {/* ── Read-only info ── */}
          <div className="flex flex-col gap-3 rounded-lg border border-neutral-border bg-neutral-50 px-4 py-3">
            <span className="text-label font-label text-subtext-color uppercase tracking-wide text-xs">
              {t('adminEditCaseDetails.caseInfo')}
            </span>
            <div className="grid grid-cols-3 gap-3">
              <ReadOnlyField
                label={t('casePage.patientInformation')}
                value={patientName || '—'}
              />
              <ReadOnlyField label={t('cases.doctor')} value={doctorName} />
              <ReadOnlyField
                label={t('casePage.caseId')}
                value={`#${caseId}`}
              />
            </div>
          </div>

          {/* ── Editable fields ── */}
          <div className="flex flex-col gap-4">
            {/* Aligner Material */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label font-label text-default-font">
                {t('casePage.alignerMaterial')}
              </label>
              {loadingMaterials ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader size="small" />
                  <span className="text-body font-body text-subtext-color">
                    {t('common.loading')}
                  </span>
                </div>
              ) : (
                <select
                  value={alignerMaterial}
                  onChange={(e) => setAlignerMaterial(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-md border border-neutral-border bg-white px-3 py-2 text-body font-body text-default-font focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {t('adminEditCaseDetails.selectMaterial')}
                  </option>
                  {alignerMaterials.map((mat) => (
                    <option key={mat.id} value={mat.name}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Aligners counts + duration */}
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label={t('casePage.treatmentPlan.upperJawAligners')}
                value={upperJawAligners}
                onChange={setUpperJawAligners}
                disabled={isSaving}
                min={0}
              />
              <NumberField
                label={t('casePage.treatmentPlan.lowerJawAligners')}
                value={lowerJawAligners}
                onChange={setLowerJawAligners}
                disabled={isSaving}
                min={0}
              />
              <NumberField
                label={`${t('casePage.treatmentPlan.estimatedDuration')} (${t('casePage.treatmentPlan.months')})`}
                value={estimatedDurationMonths}
                onChange={setEstimatedDurationMonths}
                disabled={isSaving}
                min={0}
              />
            </div>

            {/* Pricing fields */}
            <div className="grid grid-cols-2 gap-3">
              <CurrencyField
                label={t('casePage.treatmentPlan.caseStudyFee')}
                value={caseStudyFee}
                onChange={setCaseStudyFee}
                disabled={isSaving}
              />
              <CurrencyField
                label={t('casePage.treatmentPlan.deliveryCharges')}
                value={deliveryCharges}
                onChange={setDeliveryCharges}
                disabled={isSaving}
              />
              <CurrencyField
                label={t('casePage.treatmentPlan.alignersPrice')}
                value={alignersPrice}
                onChange={setAlignersPrice}
                disabled={isSaving}
              />
              <CurrencyField
                label={t('casePage.treatmentPlan.totalCost')}
                value={totalCost}
                onChange={setTotalCost}
                disabled={isSaving}
                highlight
              />
            </div>

            {/* Total-cost note */}
            <p className="text-caption font-caption text-subtext-color -mt-1">
              {t('adminEditCaseDetails.totalCostNote')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-border">
            <Button
              variant="neutral-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="brand-primary"
              icon={<FeatherSave />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? t('common.updating')
                : t('adminEditCaseDetails.saveButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Small helper sub-components ── */

const ReadOnlyField = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-caption font-caption text-subtext-color">
      {label}
    </span>
    <span className="text-body-bold font-body-bold text-default-font truncate">
      {value}
    </span>
  </div>
);

const NumberField = ({ label, value, onChange, disabled, min = 0 }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-label font-label text-default-font">{label}</label>
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-neutral-border bg-white px-3 py-2 text-body font-body text-default-font focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const CurrencyField = ({ label, value, onChange, disabled, highlight }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-label font-label text-default-font">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body font-body text-subtext-color pointer-events-none">
        $
      </span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-md border px-3 py-2 pl-6 text-body font-body focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          highlight
            ? 'border-brand-300 bg-brand-50 text-brand-700 font-body-bold'
            : 'border-neutral-border bg-white text-default-font'
        }`}
      />
    </div>
  </div>
);

export default AdminEditCaseDetailsDialog;
