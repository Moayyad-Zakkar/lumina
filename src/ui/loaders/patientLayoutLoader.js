import { isPatientRole } from '../../helper/auth';
import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function patientLayoutLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw redirect('/patient-login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !isPatientRole(profile?.role)) {
    throw redirect('/unauthorized');
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'unread');

  return {
    initialBadgeCount: error ? 0 : count || 0,
    userId: user.id,
    userRole: profile?.role,
  };
}
