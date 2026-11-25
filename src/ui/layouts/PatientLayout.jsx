import { useEffect } from 'react';
import { Outlet, useLoaderData, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { initPush, unregisterPush } from '../../helper/pushNotifications';
import { clearReminders, initReminders } from '../../helper/reminders';

// The patient screens draw their own full-page chrome (see PatientShell: logo,
// decorative circles, language switcher, back button), so this layout no longer
// renders a header or a padded container. It only shares things every patient
// screen may need, through the Outlet context:
//   signOut     - used by the sign-out button in PatientShell's top bar
//   unreadCount - from patientLayoutLoader, for the notifications bell (next step)
function PatientLayout() {
  const { initialBadgeCount } = useLoaderData();
  const navigate = useNavigate();

  // Register this phone for push notifications once the patient is logged in.
  useEffect(() => {
    initPush(navigate);
    initReminders(navigate);
  }, [navigate]);

  const signOut = async () => {
    await unregisterPush(); // must happen BEFORE signing out
    await clearReminders();
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return <Outlet context={{ signOut, unreadCount: initialBadgeCount }} />;
}

export default PatientLayout;