import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { TextField } from '../TextField';
import DialogWrapper from '../DialogWrapper';
import { FeatherPlus, FeatherCheck, FeatherPlusCircle } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

const DoctorSelection = ({ doctors, selectedDoctorId, onDoctorChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('additionalServices.dialog.doctorLabel')} *
      </label>
      <select
        value={selectedDoctorId}
        onChange={(e) => onDoctorChange(e.target.value)}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">
          {t('additionalServices.dialog.doctorPlaceholder')}
        </option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.full_name}
            {doctor.clinic ? ` (${doctor.clinic})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

const ServiceNameInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('additionalServices.dialog.serviceNameLabel')} *
      </label>
      <TextField>
        <TextField.Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('additionalServices.dialog.serviceNamePlaceholder')}
        />
      </TextField>
    </div>
  );
};

const NotesInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('additionalServices.dialog.notesLabel')}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('additionalServices.dialog.notesPlaceholder')}
        rows={3}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
      />
    </div>
  );
};

const PriceInput = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('additionalServices.dialog.priceLabel')} *
      </label>
      <TextField>
        <TextField.Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('additionalServices.dialog.pricePlaceholder')}
        />
      </TextField>
    </div>
  );
};

const DialogActions = ({ onClose, onSubmit, isSubmitting, isValid }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-border w-full mt-6">
      <Button
        variant="neutral-secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !isValid}
        icon={<FeatherCheck />}
      >
        {isSubmitting
          ? t('additionalServices.dialog.adding')
          : t('additionalServices.dialog.addService')}
      </Button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Dialog
───────────────────────────────────────────── */

const AdditionalServicesDialog = ({
  isOpen,
  onClose,
  doctors,
  initialDoctor = null,
  refetchBillingData,
}) => {
  const { t } = useTranslation();

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSelectedDoctorId(initialDoctor?.id ?? '');
      setServiceName('');
      setNotes('');
      setPrice('');
    }
  }, [isOpen, initialDoctor]);

  const isValid =
    selectedDoctorId !== '' &&
    serviceName.trim() !== '' &&
    price !== '' &&
    parseFloat(price) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Insert into your additional_services (or billing_charges) table.
      // Adjust the table name and column names to match your Supabase schema.
      const { error } = await supabase.from('additional_services').insert({
        doctor_id: selectedDoctorId,
        service_name: serviceName.trim(),
        notes: notes.trim() || null,
        price: parseFloat(price),
        // payment_status defaults to 'unpaid' in the DB
      });

      if (error) throw error;

      toast.success(t('additionalServices.success.added'));
      refetchBillingData?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t('additionalServices.errors.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('additionalServices.dialog.title')}
      description={t('additionalServices.dialog.subtitle')}
      icon={<FeatherPlusCircle />}
      loading={isSubmitting}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6 w-full pt-4">
        <DoctorSelection
          doctors={doctors}
          selectedDoctorId={selectedDoctorId}
          onDoctorChange={setSelectedDoctorId}
        />

        <ServiceNameInput value={serviceName} onChange={setServiceName} />

        <NotesInput value={notes} onChange={setNotes} />

        <PriceInput value={price} onChange={setPrice} />

        {/* Live preview */}
        {isValid && (
          <div className="bg-neutral-50 border border-neutral-border rounded-md p-4 space-y-2">
            <p className="text-caption font-caption text-subtext-color uppercase tracking-wide">
              {t('additionalServices.badge')}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-body font-body text-default-font">
                {serviceName}
              </span>
              <span className="text-body-bold font-body-bold text-default-font">
                ${parseFloat(price).toFixed(2)}
              </span>
            </div>
            {notes.trim() && (
              <p className="text-caption font-caption text-subtext-color">
                {notes}
              </p>
            )}
          </div>
        )}
      </div>

      <DialogActions
        onClose={onClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isValid={isValid}
      />
    </DialogWrapper>
  );
};

export default AdditionalServicesDialog;
