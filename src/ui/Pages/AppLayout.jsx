import Header from '../components/Header';
import { Outlet, redirect } from 'react-router';
import '../../App.css';
import { useEffect } from 'react';
import supabase from '../../helper/supabaseClient';
import { useState } from 'react';

function AppLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on component mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="">
      <Header />
      <main className="layout">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
