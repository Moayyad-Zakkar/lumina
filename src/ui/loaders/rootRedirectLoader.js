import { redirect } from 'react-router';
import { Capacitor } from '@capacitor/core';
import supabase from '../../helper/supabaseClient';
import { isAdminRole } from '../../helper/auth';

// On the Android app, skip the role-select screen when a session already exists.
export async function rootRedirectLoader() {
  if (!Capacitor.isNativePlatform()) return null; // website keeps current behavior

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role;
  if (role === 'patient') throw redirect('/patient');
  if (isAdminRole(role)) throw redirect('/admin/dashboard');
  if (role === 'user') throw redirect('/app/dashboard');
  return null; // unknown role or profile fetch failed: show the role select page
}