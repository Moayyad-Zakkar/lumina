import React, { useState, useEffect } from 'react';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import { Alert } from '../Alert';
import {
  FeatherUpload,
  FeatherX,
  FeatherCheck,
  FeatherAlertTriangle,
  FeatherImage,
  FeatherTrash2,
} from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

const VIEW_TYPES = [
  { value: 'front', label: 'Front View' },
  { value: 'left', label: 'Left View' },
  { value: 'right', label: 'Right View' },
  { value: 'upper', label: 'Upper Occlusal' },
  { value: 'lower', label: 'Lower Occlusal' },
];

const TreatmentPlanImagesUpload = ({ isOpen, onClose, caseId }) => {
  const [activeTab, setActiveTab] = useState('sequence'); // 'sequence' or 'beforeAfter'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [existingImages, setExistingImages] = useState({
    sequence: {},
    beforeAfter: {},
  });

  // Sequence files state: { front: [File, File...], left: [], ... }
  const [sequenceFiles, setSequenceFiles] = useState({
    front: [],
    left: [],
    right: [],
    upper: [],
    lower: [],
  });

  // Before/After files state: { front: { before: File, after: File }, ... }
  const [beforeAfterFiles, setBeforeAfterFiles] = useState({
    front: { before: null, after: null },
    left: { before: null, after: null },
    right: { before: null, after: null },
    upper: { before: null, after: null },
    lower: { before: null, after: null },
  });

  // Load existing images
  useEffect(() => {
    if (isOpen && caseId) {
      loadExistingImages();
    }
  }, [isOpen, caseId]);

  const loadExistingImages = async () => {
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
          if (!organized.beforeAfter[img.view_type]) {
            organized.beforeAfter[img.view_type] = {};
          }
          organized.beforeAfter[img.view_type][img.image_stage] = img;
        }
      });

      setExistingImages(organized);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleSequenceFilesChange = (viewType, files) => {
    setSequenceFiles((prev) => ({
      ...prev,
      [viewType]: [...prev[viewType], ...Array.from(files)],
    }));
  };

  const handleBeforeAfterFileChange = (viewType, stage, file) => {
    setBeforeAfterFiles((prev) => ({
      ...prev,
      [viewType]: {
        ...prev[viewType],
        [stage]: file,
      },
    }));
  };

  const removeSequenceFile = (viewType, index) => {
    setSequenceFiles((prev) => ({
      ...prev,
      [viewType]: prev[viewType].filter((_, i) => i !== index),
    }));
  };

  const removeBeforeAfterFile = (viewType, stage) => {
    setBeforeAfterFiles((prev) => ({
      ...prev,
      [viewType]: {
        ...prev[viewType],
        [stage]: null,
      },
    }));
  };

  const deleteExistingImage = async (imageId, viewType, category) => {
    try {
      // Get image details first to delete from storage
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

      toast.success('Image deleted');
      loadExistingImages();
    } catch (error) {
      toast.error('Failed to delete image');
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

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('treatment-plans')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // Insert record
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

          setUploadProgress((prev) => ({
            ...prev,
            [`sequence-${viewType}-${i}`]: 'complete',
          }));
        }
      }

      // Upload before/after images
      for (const viewType of Object.keys(beforeAfterFiles)) {
        const stages = beforeAfterFiles[viewType];

        for (const stage of ['before', 'after']) {
          const file = stages[stage];
          if (!file) continue;

          const fileExt = file.name.split('.').pop();
          const fileName = `${stage}.${fileExt}`;
          const storagePath = `${caseId}/before-after/${viewType}/${fileName}`;

          setUploadProgress((prev) => ({
            ...prev,
            [`beforeAfter-${viewType}-${stage}`]: 'uploading',
          }));

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('treatment-plans')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // Check if record exists and update or insert
          const { data: existing } = await supabase
            .from('treatment_plan_images')
            .select('id')
            .eq('case_id', caseId)
            .eq('image_category', 'beforeAfter')
            .eq('view_type', viewType)
            .eq('image_stage', stage)
            .single();

          if (existing) {
            const { error: updateError } = await supabase
              .from('treatment_plan_images')
              .update({
                storage_path: storagePath,
                file_name: fileName,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: user?.id,
                uploaded_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('treatment_plan_images')
              .insert({
                case_id: caseId,
                image_category: 'beforeAfter',
                view_type: viewType,
                image_stage: stage,
                storage_path: storagePath,
                file_name: fileName,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: user?.id,
              });

            if (insertError) throw insertError;
          }

          setUploadProgress((prev) => ({
            ...prev,
            [`beforeAfter-${viewType}-${stage}`]: 'complete',
          }));
        }
      }

      toast.success('Images uploaded successfully');

      // Reset state
      setSequenceFiles({
        front: [],
        left: [],
        right: [],
        upper: [],
        lower: [],
      });
      setBeforeAfterFiles({
        front: { before: null, after: null },
        left: { before: null, after: null },
        right: { before: null, after: null },
        upper: { before: null, after: null },
        lower: { before: null, after: null },
      });

      loadExistingImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
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
      (stages) => stages.before || stages.after
    );
    return hasSequence || hasBeforeAfter;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-neutral-border w-full">
          <div>
            <h2 className="text-heading-2 font-heading-2 text-default-font">
              Treatment Plan Images
            </h2>
            <p className="text-body font-body text-subtext-color mt-1">
              Upload sequence images and before/after comparisons for this case
            </p>
          </div>
          <Button
            variant="neutral-tertiary"
            size="small"
            icon={<FeatherX />}
            onClick={onClose}
          />
        </div>

        <div className="p-6 w-full">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-border">
            <button
              onClick={() => setActiveTab('sequence')}
              className={`px-4 py-2 text-body font-body transition-colors border-b-2 ${
                activeTab === 'sequence'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-subtext-color hover:text-default-font'
              }`}
            >
              Sequence Images
            </button>
            <button
              onClick={() => setActiveTab('beforeAfter')}
              className={`px-4 py-2 text-body font-body transition-colors border-b-2 ${
                activeTab === 'beforeAfter'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-subtext-color hover:text-default-font'
              }`}
            >
              Before & After
            </button>
          </div>

          {/* Sequence Images Tab */}
          {activeTab === 'sequence' && (
            <div className="space-y-6 w-full">
              <Alert
                variant="neutral"
                icon={<FeatherImage />}
                title="Upload sequence images"
                description="Upload multiple images for each view showing the treatment progression steps. Images will be numbered automatically."
                className="w-full"
              />

              {VIEW_TYPES.map((view) => (
                <div
                  key={view.value}
                  className="border border-neutral-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-heading-3 font-heading-3 text-default-font">
                      {view.label}
                    </h3>
                    <span className="text-sm text-subtext-color">
                      {existingImages.sequence[view.value]?.length || 0}{' '}
                      existing
                    </span>
                  </div>

                  {/* Existing images */}
                  {existingImages.sequence[view.value]?.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {existingImages.sequence[view.value].map((img) => (
                        <div
                          key={img.id}
                          className="relative group border border-neutral-border rounded p-2 bg-neutral-50"
                        >
                          <div className="text-xs text-subtext-color mb-1">
                            Step {img.sequence_order}
                          </div>
                          <button
                            onClick={() =>
                              deleteExistingImage(
                                img.id,
                                view.value,
                                'sequence'
                              )
                            }
                            className="absolute top-1 right-1 bg-error-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FeatherTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New files */}
                  {sequenceFiles[view.value].length > 0 && (
                    <div className="mb-3 space-y-1">
                      {sequenceFiles[view.value].map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-neutral-50 p-2 rounded"
                        >
                          <span className="text-sm text-default-font truncate flex-1">
                            {file.name}
                          </span>
                          <Button
                            variant="neutral-tertiary"
                            size="small"
                            icon={<FeatherX />}
                            onClick={() => removeSequenceFile(view.value, idx)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div>
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
                      icon={<FeatherUpload />}
                      disabled={uploading}
                      onClick={() =>
                        document
                          .getElementById(`sequence-${view.value}`)
                          .click()
                      }
                    >
                      Add Images
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Before/After Tab */}
          {activeTab === 'beforeAfter' && (
            <div className="space-y-6 w-full">
              <Alert
                variant="neutral"
                icon={<FeatherImage />}
                title="Upload before & after images"
                description="Upload one before and one after image for each view to show treatment results."
                className="w-full"
              />

              {VIEW_TYPES.map((view) => (
                <div
                  key={view.value}
                  className="border border-neutral-border rounded-lg p-4"
                >
                  <h3 className="text-heading-3 font-heading-3 text-default-font mb-4">
                    {view.label}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Before */}
                    <div>
                      <label className="block text-sm font-medium text-default-font mb-2">
                        Before
                      </label>

                      {/* Existing before image */}
                      {existingImages.beforeAfter[view.value]?.before && (
                        <div className="mb-2 relative group border border-neutral-border rounded p-2 bg-neutral-50">
                          <div className="text-xs text-subtext-color">
                            Current image
                          </div>
                          <button
                            onClick={() =>
                              deleteExistingImage(
                                existingImages.beforeAfter[view.value].before
                                  .id,
                                view.value,
                                'beforeAfter'
                              )
                            }
                            className="absolute top-1 right-1 bg-error-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FeatherTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {beforeAfterFiles[view.value].before ? (
                        <div className="flex items-center justify-between bg-neutral-50 p-2 rounded">
                          <span className="text-sm text-default-font truncate">
                            {beforeAfterFiles[view.value].before.name}
                          </span>
                          <Button
                            variant="neutral-tertiary"
                            size="small"
                            icon={<FeatherX />}
                            onClick={() =>
                              removeBeforeAfterFile(view.value, 'before')
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id={`before-${view.value}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleBeforeAfterFileChange(
                                view.value,
                                'before',
                                e.target.files[0]
                              )
                            }
                            disabled={uploading}
                          />
                          <Button
                            variant="neutral-secondary"
                            icon={<FeatherUpload />}
                            disabled={uploading}
                            className="w-full"
                            onClick={() =>
                              document
                                .getElementById(`before-${view.value}`)
                                .click()
                            }
                          >
                            Upload Before
                          </Button>
                        </>
                      )}
                    </div>

                    {/* After */}
                    <div>
                      <label className="block text-sm font-medium text-default-font mb-2">
                        After
                      </label>

                      {/* Existing after image */}
                      {existingImages.beforeAfter[view.value]?.after && (
                        <div className="mb-2 relative group border border-neutral-border rounded p-2 bg-neutral-50">
                          <div className="text-xs text-subtext-color">
                            Current image
                          </div>
                          <button
                            onClick={() =>
                              deleteExistingImage(
                                existingImages.beforeAfter[view.value].after.id,
                                view.value,
                                'beforeAfter'
                              )
                            }
                            className="absolute top-1 right-1 bg-error-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FeatherTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {beforeAfterFiles[view.value].after ? (
                        <div className="flex items-center justify-between bg-neutral-50 p-2 rounded">
                          <span className="text-sm text-default-font truncate">
                            {beforeAfterFiles[view.value].after.name}
                          </span>
                          <Button
                            variant="neutral-tertiary"
                            size="small"
                            icon={<FeatherX />}
                            onClick={() =>
                              removeBeforeAfterFile(view.value, 'after')
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id={`after-${view.value}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleBeforeAfterFileChange(
                                view.value,
                                'after',
                                e.target.files[0]
                              )
                            }
                            disabled={uploading}
                          />
                          <Button
                            variant="neutral-secondary"
                            icon={<FeatherUpload />}
                            disabled={uploading}
                            className="w-full"
                            onClick={() =>
                              document
                                .getElementById(`after-${view.value}`)
                                .click()
                            }
                          >
                            Upload After
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex w-full items-center gap-4 justify-between p-6 border-t border-neutral-border">
          <Button
            variant="neutral-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="brand-primary"
            icon={uploading ? <FeatherUpload /> : <FeatherCheck />}
            onClick={uploadFiles}
            disabled={!hasNewFiles() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default TreatmentPlanImagesUpload;
