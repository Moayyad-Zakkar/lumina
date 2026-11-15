// Pure logic behind the doctor's schedule editor (no React, no Supabase), so it can be tested.
// A "row" is { aligner_number, wear_days }. wear_days may be '' while the doctor is typing.

export const DEFAULT_WEAR_DAYS = 14;
export const MAX_WEAR_DAYS = 365;

// Rows for one arch: saved rows if any; otherwise a default list sized from the case,
// reusing durations from the legacy jsonb schedule when it has them.
export function buildArchRows({ dbRows = [], legacy = [], count = 0 }) {
  if (dbRows.length) {
    return [...dbRows]
      .sort((a, b) => a.aligner_number - b.aligner_number)
      .map((r) => ({ aligner_number: r.aligner_number, wear_days: r.wear_days }));
  }
  const n = Number(count) || 0;
  return Array.from({ length: n }, (_, i) => {
    const old = Number((legacy || []).find((l) => l.aligner_number === i + 1)?.duration_days);
    return { aligner_number: i + 1, wear_days: old > 0 ? old : DEFAULT_WEAR_DAYS };
  });
}

export function diffRows(before, after) {
  const was = new Map(before.map((r) => [r.aligner_number, r.wear_days]));
  const now = new Map(after.map((r) => [r.aligner_number, r.wear_days]));
  const changed = [];
  const added = [];
  const removed = [];
  for (const [n, days] of now) {
    if (!was.has(n)) added.push(n);
    else if (was.get(n) !== days) changed.push({ n, from: was.get(n), to: days });
  }
  for (const n of was.keys()) if (!now.has(n)) removed.push(n);
  return { changed, added, removed, count: changed.length + added.length + removed.length };
}

export function validateRows(rows) {
  return rows.every(
    (r) => Number.isInteger(r.wear_days) && r.wear_days >= 1 && r.wear_days <= MAX_WEAR_DAYS,
  );
}

// Copy durations from another arch, by aligner number. Aligners the other arch
// doesn't have keep their own value; the number of aligners never changes.
export function copyDurations(from, to) {
  return to.map((r) => {
    const src = from.find((f) => f.aligner_number === r.aligner_number);
    return src && Number.isInteger(src.wear_days) ? { ...r, wear_days: src.wear_days } : r;
  });
}

export function addAligner(rows) {
  const last = rows[rows.length - 1];
  return [
    ...rows,
    {
      aligner_number: rows.length + 1,
      wear_days: Number.isInteger(last?.wear_days) ? last.wear_days : DEFAULT_WEAR_DAYS,
    },
  ];
}

export const removeLast = (rows) => rows.slice(0, -1);

// Shape expected by the save_aligner_schedule() database function.
export function toPayload(schedule, arches) {
  return Object.fromEntries(
    arches.map((a) => [
      a,
      schedule[a].map((r) => ({
        aligner_number: r.aligner_number,
        wear_days: Number(r.wear_days),
      })),
    ]),
  );
}