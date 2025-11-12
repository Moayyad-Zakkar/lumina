import { isAdminRole } from '../../helper/auth';
import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function adminCasesLoader() {
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

  return null;
}
