// src/ui/loaders/rootRedirectLoader.js
// On the Android app, skip the role-select page when a session already exists.
// Faster than before: the role is read from the session token (the set_jwt_role_claim trigger
// copies profiles.role into app_metadata), so there is normally no database query at startup,
// and every network step has a timeout so a bad connection can never freeze the launch.
import { redirect } from 'react-router';
import { Capacitor } from '@capacitor/core';
import supabase from '../../helper/supabaseClient';
import { isAdminRole } from '../../helper/auth';

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const homeFor = (role) => {
  if (role === 'patient') return '/patient';
  if (isAdminRole(role)) return '/admin/dashboard';
  if (role === 'user') return '/app/dashboard';
  return null;
};

export async function rootRedirectLoader() {
  if (!Capacitor.isNativePlatform()) return null; // the website keeps its current behavior

  const sessionResult = await withTimeout(supabase.auth.getSession(), 4000);
  const session = sessionResult?.data?.session;
  if (!session) return null;

  let role = session.user?.app_metadata?.role;

  // Fallback for accounts whose token has no role claim yet.
  if (!homeFor(role)) {
    const profileResult = await withTimeout(
      supabase.from('profiles').select('role').eq('id', session.user.id).single(),
      4000,
    );
    role = profileResult?.data?.role;
  }

  const target = homeFor(role);
  if (target) throw redirect(target);
  return null; // unknown role or timeout: show the role-select page
}