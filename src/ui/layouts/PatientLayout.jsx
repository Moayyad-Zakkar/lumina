import { Outlet, Link, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';

function PatientLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-default-background">
      <header className="flex w-full items-center justify-between border-b border-neutral-border px-4 py-3">
        <img className="h-8" src="/logo.png" alt="logo" />
        <nav className="flex items-center gap-4">
          <Link to="/patient/instructions" className="text-sm">
            Instructions
          </Link>
          <button
            type="button"
            className="text-sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/patient-login');
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      <div className="container max-w-none flex w-full flex-col items-start gap-4 py-8 px-4">
        <Outlet />
      </div>
    </div>
  );
}

export default PatientLayout;
