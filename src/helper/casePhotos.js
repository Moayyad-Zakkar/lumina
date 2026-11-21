import supabase from './supabaseClient';
import { alignerOnDate, loadPatientCaseId, toLocalISODate } from './patientTracking';
import { prepareImage } from './imageCompress';

export const BUCKET = 'case-photos';
export const PHOTO_VIEWS = ['front', 'right', 'left', 'upper', 'lower', 'other'];
export const MAX_FILES_PER_UPLOAD = 10;
const SIGN_SECONDS = 3 * 60 * 60;

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// -------------------------------------------------------------- pure helpers
// Photos grouped by the day they were taken. Days: newest or oldest first.
// Inside a day the order is always front, right, left, upper, lower, other, so the same
// view lines up from one date to the next when scrolling through the timeline.
export function groupByDate(photos, newestFirst = true) {
  const byDate = new Map();
  for (const p of photos) {
    if (!byDate.has(p.taken_on)) byDate.set(p.taken_on, []);
    byDate.get(p.taken_on).push(p);
  }
  const dates = [...byDate.keys()].sort();
  if (newestFirst) dates.reverse();
  const viewOrder = (v) => PHOTO_VIEWS.indexOf(v);
  return dates.map((date) => ({
    date,
    photos: byDate
      .get(date)
      .sort(
        (a, b) =>
          viewOrder(a.view) - viewOrder(b.view) ||
          (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0),
      ),
  }));
}

// Which aligner was each arch on, on that day? null = not started yet (or no such arch).
export function alignersOnDate(starts, date) {
  return {
    upper: alignerOnDate(starts, 'upper', date),
    lower: alignerOnDate(starts, 'lower', date),
  };
}

// ------------------------------------------------------------------- storage
export async function signPaths(paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, SIGN_SECONDS);
  if (error) throw error;
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}

export async function signOne(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGN_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

// -------------------------------------------------------------------- loading
// Photos + aligner start dates + signed thumbnail urls for one case.
export async function fetchPhotoBundle(caseId) {
  const [photos, starts] = await Promise.all([
    supabase.from('case_photos').select('*').eq('case_id', caseId),
    supabase
      .from('aligner_starts')
      .select('arch, aligner_number, started_on')
      .eq('case_id', caseId),
  ]);
  if (photos.error) throw photos.error;
  if (starts.error) throw starts.error;
  const thumbUrls = await signPaths(photos.data.map((p) => p.thumb_path || p.storage_path));
  return { photos: photos.data, starts: starts.data, thumbUrls };
}

// Route loader for the patient photos page.
export async function patientPhotosLoader() {
  try {
    const caseId = await loadPatientCaseId();
    if (!caseId) return { caseId: null };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const bundle = await fetchPhotoBundle(caseId);
    return { caseId, userId: user.id, today: toLocalISODate(), ...bundle };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// -------------------------------------------------------------------- actions
// Resize, upload the photo and its thumbnail, then insert the row.
// If a later step fails, the files already uploaded are removed again.
export async function uploadCasePhoto({ caseId, userId, file, view, takenOn, note }) {
  const { full, thumb } = await prepareImage(file);
  const base = `${caseId}/${userId}/${uuid()}`;
  const storagePath = `${base}.jpg`;
  const thumbPath = `${base}_t.jpg`;
  const bucket = supabase.storage.from(BUCKET);
  const opts = { contentType: 'image/jpeg', upsert: false };

  const first = await bucket.upload(storagePath, full, opts);
  if (first.error) throw first.error;

  const second = await bucket.upload(thumbPath, thumb, opts);
  if (second.error) {
    await bucket.remove([storagePath]);
    throw second.error;
  }

  const { data, error } = await supabase
    .from('case_photos')
    .insert({
      case_id: caseId,
      patient_id: userId,
      storage_path: storagePath,
      thumb_path: thumbPath,
      view,
      taken_on: takenOn,
      note: note?.trim() || null,
    })
    .select('id')
    .single();
  if (error) {
    await bucket.remove([storagePath, thumbPath]);
    throw error;
  }
  return data.id; // the issue thread attaches photos by id
}

// Row first (the database refuses once the doctor has reviewed it), then the files.
export async function deleteCasePhoto(photo) {
  const { data, error } = await supabase
    .from('case_photos')
    .delete()
    .eq('id', photo.id)
    .select('id');
  if (error) throw error;
  if (!data.length) throw new Error('This photo can no longer be deleted.');
  await supabase.storage
    .from(BUCKET)
    .remove([photo.storage_path, photo.thumb_path].filter(Boolean));
}

// Doctor side. reviewed_at / reviewed_by are filled in by a database trigger.
export async function markPhotoReviewed(photoId) {
  const { error } = await supabase
    .from('case_photos')
    .update({ reviewed_by_doctor: true })
    .eq('id', photoId);
  if (error) throw error;
}

export async function markAllReviewed(caseId) {
  const { error } = await supabase
    .from('case_photos')
    .update({ reviewed_by_doctor: true })
    .eq('case_id', caseId)
    .eq('reviewed_by_doctor', false);
  if (error) throw error;
}