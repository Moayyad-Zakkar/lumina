import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DialogWrapper from '../DialogWrapper'; // Updated import based on your files
import { Button } from '../Button';
import { Alert } from '../Alert';
import {
  FeatherUpload,
  FeatherCheck,
  FeatherImage,
  FeatherTrash2,
  FeatherX,
  FeatherFile,
  FeatherPlus,
} from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

const TreatmentPlanImagesUpload = ({ isOpen, onClose, caseId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sequence'); // 'sequence' or 'beforeAfter'
  const [uploading, setUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState({});
  const [existingImages, setExistingImages] = useState({
    sequence: {},
    beforeAfter: {},
  });

  // State for selected files
  const [sequenceFiles, setSequenceFiles] = useState({
    front: [],
    left: [],
    right: [],
    upper: [],
    lower: [],
  });

  const [beforeAfterFiles, setBeforeAfterFiles] = useState({
    front: null,
    left: null,
    right: null,
    upper: null,
    lower: null,
  });

  // Dynamic View Types with Translations
  const VIEW_TYPES = useMemo(
    () => [
      { value: 'front', label: t('treatmentPlanImages.views.front') },
      { value: 'left', label: t('treatmentPlanImages.views.left') },
      { value: 'right', label: t('treatmentPlanImages.views.right') },
      { value: 'upper', label: t('treatmentPlanImages.views.upper') },
      { value: 'lower', label: t('treatmentPlanImages.views.lower') },
    ],
    [t]
  );

  const loadExistingImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('treatment_plan_images')
        .select('*')
        .eq('case_id', caseId)
        .order('sequence_order', { ascending: true });

      if (error) throw error;

      const organized = {
        sequence: {},
        beforeAfter: {},
      };

      data?.forEach((img) => {
        if (img.image_category === 'sequence') {
          if (!organized.sequence[img.view_type]) {
            organized.sequence[img.view_type] = [];
          }
          organized.sequence[img.view_type].push(img);
        } else if (img.image_category === 'beforeAfter') {
          organized.beforeAfter[img.view_type] = img;
        }
      });

      setExistingImages(organized);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, [caseId]);

  useEffect(() => {
    if (isOpen && caseId) {
      loadExistingImages();
    }
  }, [isOpen, caseId, loadExistingImages]);

  const handleSequenceFilesChange = (viewType, files) => {
    setSequenceFiles((prev) => ({
      ...prev,
      [viewType]: [...prev[viewType], ...Array.from(files)],
    }));
  };

  const handleBeforeAfterFileChange = (viewType, file) => {
    setBeforeAfterFiles((prev) => ({
      ...prev,
      [viewType]: file,
    }));
  };

  const removeSequenceFile = (viewType, index) => {
    setSequenceFiles((prev) => ({
      ...prev,
      [viewType]: prev[viewType].filter((_, i) => i !== index),
    }));
  };

  const removeBeforeAfterFile = (viewType) => {
    setBeforeAfterFiles((prev) => ({
      ...prev,
      [viewType]: null,
    }));
  };

  const deleteExistingImage = async (imageId) => {
    try {
      const { data: img } = await supabase
        .from('treatment_plan_images')
        .select('storage_path')
        .eq('id', imageId)
        .single();

      if (img?.storage_path) {
        await supabase.storage
          .from('treatment-plans')
          .remove([img.storage_path]);
      }

      const { error } = await supabase
        .from('treatment_plan_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success(t('treatmentPlanImages.toast.deleted'));
      loadExistingImages();
    } catch (error) {
      toast.error(t('treatmentPlanImages.toast.deleteFailed'));
      console.error(error);
    }
  };

  const uploadFiles = async () => {
    setUploading(true);
    setUploadProgress({});

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Upload sequence images
      for (const viewType of Object.keys(sequenceFiles)) {
        const files = sequenceFiles[viewType];
        if (files.length === 0) continue;

        const existingCount = existingImages.sequence[viewType]?.length || 0;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const sequenceOrder = existingCount + i + 1;
          const fileExt = file.name.split('.').pop();
          const fileName = `step_${String(sequenceOrder).padStart(
            3,
            '0'
          )}.${fileExt}`;
          const storagePath = `${caseId}/sequence/${viewType}/${fileName}`;

          setUploadProgress((prev) => ({
            ...prev,
            [`sequence-${viewType}-${i}`]: 'uploading',
          }));

          const { error: uploadError } = await supabase.storage
            .from('treatment-plans')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from('treatment_plan_images')
            .insert({
              case_id: caseId,
              image_category: 'sequence',
              view_type: viewType,
              sequence_order: sequenceOrder,
              storage_path: storagePath,
              file_name: fileName,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user?.id,
            });

          if (dbError) throw dbError;
        }
      }

      // Upload before/after images
      for (const viewType of Object.keys(beforeAfterFiles)) {
        const file = beforeAfterFiles[viewType];
        if (!file) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `before-after.${fileExt}`;
        const storagePath = `${caseId}/before-after/${viewType}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('treatment-plans')
          .upload(storagePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: existing } = await supabase
          .from('treatment_plan_images')
          .select('id')
          .eq('case_id', caseId)
          .eq('image_category', 'beforeAfter')
          .eq('view_type', viewType)
          .single();

        const payload = {
          case_id: caseId,
          image_category: 'beforeAfter',
          view_type: viewType,
          image_stage: 'combined',
          storage_path: storagePath,
          file_name: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
          uploaded_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from('treatment_plan_images')
            .update(payload)
            .eq('id', existing.id);
        } else {
          await supabase.from('treatment_plan_images').insert(payload);
        }
      }

      toast.success(t('treatmentPlanImages.toast.uploaded'));

      // Reset state
      setSequenceFiles({
        front: [],
        left: [],
        right: [],
        upper: [],
        lower: [],
      });
      setBeforeAfterFiles({
        front: null,
        left: null,
        right: null,
        upper: null,
        lower: null,
      });

      loadExistingImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('treatmentPlanImages.toast.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const hasNewFiles = () => {
    const hasSequence = Object.values(sequenceFiles).some(
      (files) => files.length > 0
    );
    const hasBeforeAfter = Object.values(beforeAfterFiles).some(
      (file) => file !== null
    );
    return hasSequence || hasBeforeAfter;
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('treatmentPlanImages.title')}
      description={t('treatmentPlanImages.subtitle')}
      icon={<FeatherImage />}
      maxWidth="max-w-[800px]" // Made wider for better gallery view
      loading={uploading}
    >
      <div className="w-full flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-border">
          <button
            onClick={() => setActiveTab('sequence')}
            className={`px-4 py-2 text-body font-body transition-colors border-b-2 ${
              activeTab === 'sequence'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-subtext-color hover:text-default-font'
            }`}
          >
            {t('treatmentPlanImages.tabs.sequence')}
          </button>
          <button
            onClick={() => setActiveTab('beforeAfter')}
            className={`px-4 py-2 text-body font-body transition-colors border-b-2 ${
              activeTab === 'beforeAfter'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-subtext-color hover:text-default-font'
            }`}
          >
            {t('treatmentPlanImages.tabs.beforeAfter')}
          </button>
        </div>

        {/* SEQUENCE TAB */}
        {activeTab === 'sequence' && (
          <div className="space-y-6">
            <Alert
              variant="neutral"
              icon={<FeatherImage />}
              title={t('treatmentPlanImages.alerts.sequence.title')}
              description={t('treatmentPlanImages.alerts.sequence.description')}
            />

            {VIEW_TYPES.map((view) => {
              const existingList = existingImages.sequence[view.value] || [];
              const pendingList = sequenceFiles[view.value] || [];

              return (
                <div
                  key={view.value}
                  className="border border-neutral-border rounded-lg bg-white overflow-hidden"
                >
                  <div className="bg-neutral-50 p-3 border-b border-neutral-border flex justify-between items-center">
                    <h3 className="text-body-bold font-body-bold text-default-font">
                      {view.label}
                    </h3>
                    <div className="text-xs text-subtext-color bg-white px-2 py-1 rounded border border-neutral-border">
                      {existingList.length + pendingList.length}{' '}
                      {t('treatmentPlanImages.labels.step')}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-4">
                    {/* 1. Existing Steps */}
                    {existingList.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-caption font-caption text-subtext-color uppercase tracking-wider">
                          {t('treatmentPlanImages.labels.existing')}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {existingList.map((img) => (
                            <div
                              key={img.id}
                              className="relative group border border-neutral-border rounded-md p-3 bg-neutral-50 flex flex-col gap-2 items-center justify-center text-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-caption font-bold">
                                {img.sequence_order}
                              </div>
                              <span className="text-caption text-subtext-color truncate w-full">
                                {img.file_name}
                              </span>
                              <button
                                onClick={() => deleteExistingImage(img.id)}
                                className="absolute -top-2 -right-2 bg-white border border-error-200 text-error-600 p-1.5 rounded-full shadow-sm hover:bg-error-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <FeatherTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Pending Uploads */}
                    {pendingList.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-caption font-caption text-brand-600 uppercase tracking-wider">
                          {t('treatmentPlanImages.labels.newUploads')}
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {pendingList.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-brand-50 border border-brand-100 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FeatherFile className="w-4 h-4 text-brand-600 flex-shrink-0" />
                                <span className="text-sm text-default-font truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-brand-600 whitespace-nowrap">
                                  ({t('treatmentPlanImages.labels.step')}{' '}
                                  {existingList.length + idx + 1})
                                </span>
                              </div>
                              <Button
                                variant="neutral-tertiary"
                                size="small"
                                icon={<FeatherX />}
                                onClick={() =>
                                  removeSequenceFile(view.value, idx)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Empty State / Upload Button */}
                    <div className="mt-2">
                      <input
                        type="file"
                        id={`sequence-${view.value}`}
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleSequenceFilesChange(view.value, e.target.files)
                        }
                        disabled={uploading}
                      />
                      <Button
                        variant="neutral-secondary"
                        size="small"
                        icon={<FeatherPlus />}
                        disabled={uploading}
                        className="w-full justify-center border-dashed"
                        onClick={() =>
                          document
                            .getElementById(`sequence-${view.value}`)
                            .click()
                        }
                      >
                        {t('treatmentPlanImages.buttons.addImages')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BEFORE & AFTER TAB */}
        {activeTab === 'beforeAfter' && (
          <div className="space-y-6">
            <Alert
              variant="neutral"
              icon={<FeatherImage />}
              title={t('treatmentPlanImages.alerts.beforeAfter.title')}
              description={t(
                'treatmentPlanImages.alerts.beforeAfter.description'
              )}
            />

            {VIEW_TYPES.map((view) => (
              <div
                key={view.value}
                className="border border-neutral-border rounded-lg bg-white overflow-hidden"
              >
                <div className="bg-neutral-50 p-3 border-b border-neutral-border flex justify-between items-center">
                  <h3 className="text-body-bold font-body-bold text-default-font">
                    {view.label}
                  </h3>
                  {existingImages.beforeAfter[view.value] && (
                    <span className="text-xs text-success-700 bg-success-50 px-2 py-1 rounded border border-success-200 flex items-center gap-1">
                      <FeatherCheck className="w-3 h-3" />
                      {t('treatmentPlanImages.labels.imageExists')}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {/* Current Image */}
                  {existingImages.beforeAfter[view.value] && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-neutral-50 rounded-md border border-neutral-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-200 rounded flex items-center justify-center">
                          <FeatherImage className="w-4 h-4 text-subtext-color" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-default-font">
                            {t('treatmentPlanImages.labels.currentImage')}
                          </span>
                          <span className="text-xs text-subtext-color">
                            {existingImages.beforeAfter[view.value].file_name}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive-tertiary"
                        size="small"
                        icon={<FeatherTrash2 />}
                        onClick={() =>
                          deleteExistingImage(
                            existingImages.beforeAfter[view.value].id
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Pending Upload */}
                  {beforeAfterFiles[view.value] && (
                    <div className="mb-4 flex items-center justify-between bg-brand-50 border border-brand-100 p-3 rounded-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FeatherFile className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        <span className="text-sm text-default-font truncate">
                          {beforeAfterFiles[view.value].name}
                        </span>
                        <span className="text-xs text-brand-600 bg-white px-1 rounded">
                          New
                        </span>
                      </div>
                      <Button
                        variant="neutral-tertiary"
                        size="small"
                        icon={<FeatherX />}
                        onClick={() => removeBeforeAfterFile(view.value)}
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    id={`beforeAfter-${view.value}`}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleBeforeAfterFileChange(view.value, e.target.files[0])
                    }
                    disabled={uploading}
                  />
                  <Button
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherUpload />}
                    disabled={uploading}
                    className="w-full justify-center"
                    onClick={() =>
                      document
                        .getElementById(`beforeAfter-${view.value}`)
                        .click()
                    }
                  >
                    {existingImages.beforeAfter[view.value]
                      ? t('treatmentPlanImages.buttons.replace')
                      : t('treatmentPlanImages.buttons.select')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Footer for DialogWrapper */}
        <div className="flex w-full items-center justify-end gap-3 pt-4 border-t border-neutral-border mt-auto">
          <Button
            variant="neutral-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="brand-primary"
            icon={uploading ? null : <FeatherCheck />}
            onClick={uploadFiles}
            disabled={!hasNewFiles() || uploading}
            loading={uploading}
          >
            {uploading
              ? t('treatmentPlanImages.buttons.uploading')
              : t('treatmentPlanImages.buttons.upload')}
          </Button>
        </div>
      </div>
    </DialogWrapper>
  );
};

export default TreatmentPlanImagesUpload;
