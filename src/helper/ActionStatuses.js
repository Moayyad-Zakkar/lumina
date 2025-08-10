// src/helper/caseActions.js
import supabase from './supabaseClient';

// Statuses that require admin action
const ADMIN_ACTION_STATUSES = ['submitted', 'approved'];

// Statuses that require user action (customize as needed)
const USER_ACTION_STATUSES = [
  'under_review',
  'awaiting_user_approval',
  'in_production',
  'ready_for_delivery',
  'delivered',
  'completed',
];

export async function fetchActionNeededCasesCount(role, userId) {
  let query = supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });

  if (role === 'admin') {
    query = query.in('status', ADMIN_ACTION_STATUSES);
  } else {
    query = query.eq('user_id', userId).in('status', USER_ACTION_STATUSES);
  }

  const { count, error } = await query;
  if (error) {
    console.error('Error fetching action-needed cases:', error);
    return 0;
  }
  return count || 0;
}
