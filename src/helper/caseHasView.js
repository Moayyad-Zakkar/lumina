import supabase from './supabaseClient';

// Helper function to check if case has treatment images
export const checkCaseTreatmentImages = async (caseId) => {
  const { data, error } = await supabase
    .from('treatment_plan_images')
    .select('id, image_category, view_type')
    .eq('case_id', caseId)
    .limit(1);

  if (error) throw error;

  return {
    hasImages: data && data.length > 0,
    imageCount: data?.length || 0,
  };
};

// Get detailed image status
export const getCaseTreatmentImageStatus = async (caseId) => {
  const { data, error } = await supabase
    .from('treatment_plan_images')
    .select('image_category, view_type')
    .eq('case_id', caseId);

  if (error) throw error;

  const hasSequence = data?.some((img) => img.image_category === 'sequence');
  const hasBeforeAfter = data?.some(
    (img) => img.image_category === 'beforeAfter'
  );

  const viewsWithSequence = [
    ...new Set(
      data
        ?.filter((img) => img.image_category === 'sequence')
        .map((img) => img.view_type)
    ),
  ];

  return {
    hasImages: data && data.length > 0,
    hasSequence,
    hasBeforeAfter,
    viewsWithSequence,
    totalImages: data?.length || 0,
  };
};
