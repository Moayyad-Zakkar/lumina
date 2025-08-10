import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function userDashboardLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to unauthorized if not authenticated
    throw redirect('/unauthorized');
  }

  // Fetch total cases
  const { count, error: countError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch recent cases
  const { data: recentCases, error: recentError } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    totalCases: countError ? '—' : count,
    recentCases: recentCases || [],
    casesError: recentError?.message || null,
  };
}
