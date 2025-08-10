import supabase from '../../helper/supabaseClient';
import { redirect } from 'react-router';

export async function adminDoctorDetailsLoader({ params }) {
  const { doctorId } = params;

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

  const { data: doctor, error: docErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, clinic, avatar_url, address')
    .eq('id', doctorId)
    .single();

  if (docErr) {
    return { doctor: null, cases: [], error: docErr.message };
  }

  const { data: cases, error: casesErr } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(50);

  return { doctor, cases: cases || [], error: casesErr?.message || null };
}
