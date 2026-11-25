// src/helper/pushNotifications.js
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import toast from 'react-hot-toast';
import supabase from './supabaseClient';
import { routeForNotification } from './notificationRoutes';

let listenersAdded = false;
let currentToken = null;
let navigateFn = null;

/**
 * Call once after the user is logged in (from an authenticated layout).
 * Safe to call again on every mount: listeners are only added once.
 * `navigate` is the react-router navigate function (kept fresh on each call).
 * Everything that touches the plugin lives INSIDE this function, so nothing runs on the website.
 */
export async function initPush(navigate) {
  if (!Capacitor.isNativePlatform()) return;
  navigateFn = navigate;

  if (!listenersAdded) {
    listenersAdded = true;

    await PushNotifications.addListener('registration', async ({ value }) => {
      currentToken = value;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { error } = await supabase.rpc('register_device_token', {
        p_token: value,
        p_platform: 'android',
        p_timezone: timezone,
      });
      if (error) console.error('register_device_token failed', error);
    });

    await PushNotifications.addListener('registrationError', (e) => {
      console.error('push registration error', e);
    });

    // App is open: Android does not show a system notification, so show a toast.
    await PushNotifications.addListener('pushNotificationReceived', (n) => {
      toast(n.title ? `${n.title}${n.body ? ' - ' + n.body : ''}` : n.body || '', {
        duration: 5000,
      });
    });

    // User tapped a notification: open the right screen for their role.
    await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      const d = action.notification?.data || {};
      const { data } = await supabase.auth.getSession();
      const role = data.session?.user?.app_metadata?.role;
      const route = routeForNotification({ type: d.type, case_id: d.case_id, data: d }, role);
      if (route && navigateFn) navigateFn(route);
    });
  }

  // Android 8+ needs a channel; the edge function sends to the "messages" channel.
  await PushNotifications.createChannel({
    id: 'messages',
    name: 'Messages',
    description: 'Replies, photos and case updates',
    importance: 4,
    visibility: 1,
  });

  // Android 13+ shows a permission prompt here the first time.
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();
}

/**
 * Call right BEFORE supabase.auth.signOut(), so the next person who uses this phone
 * does not receive the previous user's notifications.
 */
export async function unregisterPush() {
  if (!Capacitor.isNativePlatform() || !currentToken) return;
  try {
    await supabase.from('device_tokens').delete().eq('token', currentToken);
  } catch (e) {
    console.error('unregisterPush failed', e);
  }
}