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
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole(profile?.role || user.app_metadata?.role || null);
      }

      setLoading(false);
    };

    getRole();
  }, []);

  return { role, loading };
}
