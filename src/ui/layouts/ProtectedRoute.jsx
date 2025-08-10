import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Loader } from '../components/Loader';

// Protected route component
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    // Set up auth state listener
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
    return <Loader size="large" />;
  }

  if (!user) {
    navigate('/login');
    return;
  }

  return children;
}
