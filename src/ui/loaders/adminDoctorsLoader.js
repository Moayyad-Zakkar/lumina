import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function adminDoctorsLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || profile?.role !== 'admin')
    throw redirect('/unauthorized');

  // No server-side pagination here (client page handles it). Just return 200.
  return null;
}
