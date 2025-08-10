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

  // Fetch total number of cases
  const { count, error: countError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });

  // Fetch 5 most recent cases with doctor profile info
  const { data: recentCases, error: recentError } = await supabase
    .from('cases')
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        clinic,
        phone
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(5);

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
    totalCases: countError ? '—' : count,
    recentCases: normalizedCases,
    casesError: recentError?.message || null,
  };
}
