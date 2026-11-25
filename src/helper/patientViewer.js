// src/helper/patientViewer.js
// Loader for the patient's Treatment plan viewer page.
// Only reads what the viewer needs: the plan images/videos (public storage urls) and the
// number of aligners per arch (from aligner_schedule, which patients can already read).
// It deliberately does NOT read the `cases` row.
import supabase from './supabaseClient';
import { loadPatientCaseId, totalAligners } from './patientTracking';

export const VIEWER_VIEWS = ['front', 'left', 'right', 'upper', 'lower'];

export async function patientViewerLoader() {
  try {
    const caseId = await loadPatientCaseId();
    if (!caseId) return { caseId: null };

    const [imagesRes, scheduleRes] = await Promise.all([
      supabase
        .from('treatment_plan_images')
        .select('*')
        .eq('case_id', caseId)
        .order('sequence_order', { ascending: true }),
      supabase.from('aligner_schedule').select('arch, aligner_number').eq('case_id', caseId),
    ]);
    if (imagesRes.error) throw imagesRes.error;
    if (scheduleRes.error) throw scheduleRes.error;

    const urlFor = (path) =>
      supabase.storage.from('treatment-plans').getPublicUrl(path).data.publicUrl;

    const sequenceImages = Object.fromEntries(VIEWER_VIEWS.map((v) => [v, []]));
    const sequenceVideos = {};
    const beforeAfter = {};

    for (const img of imagesRes.data) {
      const url = urlFor(img.storage_path);
      if (img.image_category === 'sequence') {
        if (img.is_video) sequenceVideos[img.view_type] = url;
        else if (sequenceImages[img.view_type]) sequenceImages[img.view_type].push({ id: img.id, url });
      } else if (img.image_category === 'beforeAfter') {
        beforeAfter[img.view_type] = url;
      }
    }

    return {
      caseId,
      sequenceImages,
      sequenceVideos,
      beforeAfter,
      upperCount: totalAligners(scheduleRes.data, 'upper'),
      lowerCount: totalAligners(scheduleRes.data, 'lower'),
    };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}