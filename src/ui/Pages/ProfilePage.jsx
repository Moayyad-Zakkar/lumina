import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import { IconButton } from '../components/IconButton';
import { FeatherCamera } from '@subframe/core';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    clinic: '',
    avatar_url: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          clinic: data.clinic || '',
          avatar_url: data.avatar_url || '',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        clinic: profile.clinic,
        avatar_url: profile.avatar_url,
      })
      .eq('id', user.id);

    if (!error) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error('Failed to update profile.');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const cleanFileName = (name) =>
      name
        .normalize('NFD') // split diacritics
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^\w.-]/g, '_'); // replace spaces/symbols with _

    const safeFileName = cleanFileName(file.name);
    const filePath = `avatars/${user.id}/${Date.now()}-${safeFileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      toast.success('Avatar updated.');
    } else {
      toast.error('Failed to upload avatar.');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex w-full max-w-[576px] flex-col items-start gap-12">
        <div className="flex w-full flex-col items-center">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Profile Settings
          </span>
          <span className="text-body font-body text-subtext-color">
            Manage your personal information and contact details
          </span>
        </div>
        <div className="flex w-full flex-col items-start gap-6">
          {/* Avatar section */}
          <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <div className="flex w-full flex-col items-start">
              <span className="w-full text-heading-3 font-heading-3 text-default-font">
                Profile Photo
              </span>
              <span className="w-full text-body font-body text-subtext-color">
                Upload a profile picture or avatar
              </span>
            </div>
            <div className="flex w-full items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar size="x-large" image={profile.avatar_url}>
                  {profile.full_name?.charAt(0)}
                </Avatar>
                <IconButton
                  icon={<FeatherCamera />}
                  onClick={() => fileInputRef.current?.click()}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  hidden
                />
              </div>
            </div>
          </div>

          {/* Info section */}
          <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <div className="flex w-full flex-col items-start">
              <span className="w-full text-heading-3 font-heading-3 text-default-font">
                Personal Information
              </span>
              <span className="w-full text-body font-body text-subtext-color">
                Update your personal details and contact information
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-6">
              {[
                {
                  label: 'Full Name',
                  name: 'full_name',
                  placeholder: 'Enter your full name',
                },
                {
                  label: 'Email',
                  name: 'email',
                  placeholder: 'Your Email',
                  disabled: true,
                },
                {
                  label: 'Phone Number',
                  name: 'phone',
                  placeholder: 'Enter your phone number',
                },
                {
                  label: 'Clinic Name',
                  name: 'clinic',
                  placeholder: 'Enter your clinic name',
                },
              ].map((field) => (
                <TextField
                  key={field.name}
                  className="w-full"
                  label={field.label}
                >
                  <TextField.Input
                    name={field.name}
                    placeholder={field.placeholder}
                    value={profile[field.name]}
                    onChange={handleInputChange}
                    disabled={field.disabled}
                  />
                </TextField>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full items-start justify-between">
          <Button variant="neutral-secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
