import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    setProfile(profileData);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    profile,
    refreshProfile: fetchProfile,
  };
}
