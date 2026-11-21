import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Loader } from '../components/Loader';

// Protected route component
export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read the stored session (local, no network call), so a slow
    // connection on app start doesn't look like being logged out
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <Loader size="large" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
}