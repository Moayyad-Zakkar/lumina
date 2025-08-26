import supabase from '../../helper/supabaseClient';
import { capitalizeFirst } from '../../helper/formatText';
import { redirect } from 'react-router';

export async function adminDashboardLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login');
  }

  // Optional: Check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw redirect('/unauthorized');
  }

  // Fetch all counts and recent cases in parallel
  const [countRes, submittedRes, completedRes, recentRes] = await Promise.all([
    supabase.from('cases').select('id', { count: 'exact', head: true }),
    supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('cases')
      .select(
        `id, first_name, last_name, status, created_at, user_id, profiles:user_id (full_name, avatar_url, clinic, phone)`
      )
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const { count: totalCount, error: countError } = countRes;
  const { count: submittedCount, error: submittedError } = submittedRes;
  const { count: completedCount, error: completedError } = completedRes;
  const { data: recentCases, error: recentError } = recentRes;

  const normalizedCases = (recentCases || []).map((c) => ({
    ...c,
    first_name: capitalizeFirst(c.first_name),
    last_name: capitalizeFirst(c.last_name),
    profiles: c.profiles
      ? {
          ...c.profiles,
          full_name: capitalizeFirst(c.profiles.full_name),
        }
      : c.profiles,
  }));

  return {
    totalCases: countError ? '—' : totalCount,
    submittedCases: submittedError ? '—' : submittedCount,
    completedCases: completedError ? '—' : completedCount,
    recentCases: normalizedCases,
    casesError: recentError?.message || null,
    submittedError: submittedError?.message || null,
    completedError: completedError?.message || null,
  };
}
