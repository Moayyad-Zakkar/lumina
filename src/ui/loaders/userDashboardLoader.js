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

  //Fetch user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch total cases
  const { count, error: countError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch submitted cases count
  const { count: submittedCount, error: submittedError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'submitted');

  const { count: completedCount, error: completedError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  // Fetch recent cases
  const { data: recentCases, error: recentError } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    totalCases: countError ? '—' : count,
    submittedCases: submittedError ? '—' : submittedCount,
    completedCases: completedError ? '_' : completedCount,
    recentCases: recentCases || [],
    casesError: recentError?.message || null,
    submittedError: submittedError?.message || null,
    profile: profile || '_',
  };
}
