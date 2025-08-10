import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        setRole(user.app_metadata?.role || 'user');
      }

      setLoading(false);
    };

    getRole();
  }, []);

  return { role, loading };
}
