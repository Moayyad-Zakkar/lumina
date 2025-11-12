import { isAdminRole } from '../../helper/auth';
import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function adminCaseLoader({ params }) {
  const { caseId } = params;

  // Ensure admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !isAdminRole(profile?.role)) {
    throw redirect('/unauthorized');
  }

  const { data, error } = await supabase
    .from('cases')
    .select(
      `
      *,
      profiles (
        full_name,
        clinic,
        phone
      )
    `
    )
    .eq('id', caseId)
    .single();

  if (error) {
    console.error('Error loading case:', error);
    return { error: error.message, caseData: null };
  }

  // Fallback: if relationship isn't auto-resolved, fetch profile directly
  let enriched = data;
  if (!data?.profiles && data?.user_id) {
    const { data: doctor, error: doctorErr } = await supabase
      .from('profiles')
      .select('full_name, clinic, phone')
      .eq('id', data.user_id)
      .single();
    if (!doctorErr && doctor) {
      enriched = { ...data, profiles: doctor };
    }
  }

  return { caseData: enriched };
}
