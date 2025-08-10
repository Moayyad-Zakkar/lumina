import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function userLayoutLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw redirect('/login');

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'unread');

  return {
    initialBadgeCount: error ? 0 : count || 0,
    userId: user.id,
  };
}
