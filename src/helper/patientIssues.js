import supabase from './supabaseClient';
import { loadPatientCaseId, toLocalISODate } from './patientTracking';
import { signPaths, uploadCasePhoto } from './casePhotos';

export const ISSUE_CATEGORIES = ['not_fit', 'pain', 'attachment_off', 'broken_lost', 'other'];
export const ISSUE_ARCHES = ['both', 'upper', 'lower'];
export const MAX_ISSUE_PHOTOS = 3; // per message (the database allows 5)
export const MAX_ISSUE_BODY = 2000;

// -------------------------------------------------------------- pure helpers
// Doctor side: waiting for the doctor's reply.
export const needsDoctorReply = (issue) => issue.status === 'open';

// Patient side: the doctor wrote something the patient hasn't opened yet.
export const hasUnreadReply = (issue) =>
  issue.last_author_role === 'doctor' &&
  (!issue.patient_seen_at || issue.patient_seen_at < issue.last_message_at);

// Open first (they need action), then answered, then resolved; newest activity first inside each.
const STATUS_ORDER = { open: 0, answered: 1, resolved: 2 };
export function sortIssues(issues) {
  return [...issues].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.last_message_at < b.last_message_at ? 1 : a.last_message_at > b.last_message_at ? -1 : 0),
  );
}

// -------------------------------------------------------------------- loading
// Issues with their messages (oldest first) and each message's photos, plus signed thumbnails.
export async function fetchIssues(caseId) {
  const [issues, photos] = await Promise.all([
    supabase
      .from('patient_issues')
      .select('*, issue_messages(*)')
      .eq('case_id', caseId)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('case_photos')
      .select('id, message_id, storage_path, thumb_path, view, taken_on, created_at')
      .eq('case_id', caseId)
      .not('message_id', 'is', null),
  ]);
  if (issues.error) throw issues.error;
  if (photos.error) throw photos.error;

  const byMessage = new Map();
  for (const p of photos.data) {
    if (!byMessage.has(p.message_id)) byMessage.set(p.message_id, []);
    byMessage.get(p.message_id).push(p);
  }

  const list = issues.data.map(({ issue_messages, ...issue }) => ({
    ...issue,
    messages: [...issue_messages]
      .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id))
      .map((m) => ({ ...m, photos: byMessage.get(m.id) || [] })),
  }));

  const thumbUrls = await signPaths(photos.data.map((p) => p.thumb_path || p.storage_path));
  return { issues: sortIssues(list), thumbUrls };
}

// Number of issues waiting for the doctor (badge on the case page).
export async function countOpenIssues(caseId) {
  const { count, error } = await supabase
    .from('patient_issues')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId)
    .eq('status', 'open');
  if (error) throw error;
  return count || 0;
}

export async function patientIssuesLoader() {
  try {
    const caseId = await loadPatientCaseId();
    if (!caseId) return { caseId: null };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const bundle = await fetchIssues(caseId);
    return { caseId, userId: user.id, today: toLocalISODate(), ...bundle };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// -------------------------------------------------------------------- actions
// Upload the picked files one by one (they become normal timeline photos), return their ids.
// If one fails, the ones already uploaded stay in the patient's photo timeline where they can
// be deleted, because they are not attached to anything yet.
async function uploadAttachments({ caseId, userId, files }) {
  const ids = [];
  const today = toLocalISODate();
  for (const file of files) {
    ids.push(
      await uploadCasePhoto({ caseId, userId, file, view: 'other', takenOn: today, note: null }),
    );
  }
  return ids;
}

export async function createIssue({ caseId, userId, category, arch, body, files = [] }) {
  const photoIds = await uploadAttachments({ caseId, userId, files });
  const { data, error } = await supabase.rpc('create_patient_issue', {
    p_case_id: caseId,
    p_category: category,
    p_arch: arch,
    p_body: body,
    p_photo_ids: photoIds,
  });
  if (error) throw error;
  return data;
}

export async function sendIssueMessage({ caseId, userId, issueId, body, files = [] }) {
  const photoIds = files.length ? await uploadAttachments({ caseId, userId, files }) : [];
  const { error } = await supabase.rpc('post_issue_message', {
    p_issue_id: issueId,
    p_body: body,
    p_photo_ids: photoIds,
  });
  if (error) throw error;
}

export async function setIssueStatus(issueId, status) {
  const { error } = await supabase.rpc('set_issue_status', {
    p_issue_id: issueId,
    p_status: status,
  });
  if (error) throw error;
}

export async function markIssueSeen(issueId) {
  const { error } = await supabase.rpc('mark_issue_seen', { p_issue_id: issueId });
  if (error) throw error;
}

// Timestamps (timestamptz) shown in the viewer's own time zone.
export function formatDateTime(ts, lang) {
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(ts),
    );
  } catch {
    return String(ts);
  }
}