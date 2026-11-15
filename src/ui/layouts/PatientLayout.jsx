import { Outlet, useLoaderData, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';

// The patient screens draw their own full-page chrome (see PatientShell: logo,
// decorative circles, language switcher, back button), so this layout no longer
// renders a header or a padded container. It only shares things every patient
// screen may need, through the Outlet context:
//   signOut     - used by the sign-out button in PatientShell's top bar
//   unreadCount - from patientLayoutLoader, for the notifications bell (next step)
function PatientLayout() {
  const { initialBadgeCount } = useLoaderData();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return <Outlet context={{ signOut, unreadCount: initialBadgeCount }} />;
}

export default PatientLayout;