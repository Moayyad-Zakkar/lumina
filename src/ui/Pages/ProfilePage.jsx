import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { IconButton } from '../components/IconButton';
import { FeatherCamera } from '@subframe/core';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import Headline from '../components/Headline';
import Error from '../components/Error';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    clinic: '',
    address: '',
    avatar_url: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            clinic: data.clinic || '',
            address: data.address || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        toast.error(t('profile.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          clinic: profile.clinic,
          address: profile.address,
          avatar_url: profile.avatar_url,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      toast.success(t('profile.success.updated'));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      toast.error(t('profile.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const cleanFileName = (name) =>
        name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w.-]/g, '_');

      const safeFileName = cleanFileName(file.name);
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrlData.publicUrl }));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success(t('profile.success.avatarUpdated'));
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message);
      toast.error(err?.message || t('profile.errors.avatarFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <>
      {error && <Error error={error} />}

      <Headline submit={false}>{t('profile.title')}</Headline>

      <p className="text-body font-body text-subtext-color">
        {t('profile.subtitle')}
      </p>

      {loading ? (
        <div className="flex w-full h-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <>
          {/* Avatar Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('profile.profilePhoto')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <div>
                <span className="block text-body font-body text-subtext-color">
                  {t('profile.avatarDescription')}
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
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && (
                    <span className="text-caption text-subtext-color">
                      {t('common.loading')}
                    </span>
                  )}
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
          </div>

          {/* Personal Information Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('profile.personalInformation')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              {/*<div>
                <span className="text-heading-3 font-heading-3 text-default-font">
                  {t('profile.personalInformation')}
                </span>
                <span className="block text-body font-body text-subtext-color">
                  {t('profile.personalInfoDescription')}
                </span>
              </div>*/}
              <TextField className="w-full" label={t('profile.fullName')}>
                <TextField.Input
                  name="full_name"
                  placeholder={t('profile.fullNamePlaceholder')}
                  value={profile.full_name}
                  onChange={handleInputChange}
                />
              </TextField>
              <TextField className="w-full" label={t('profile.email')}>
                <TextField.Input
                  name="email"
                  placeholder={t('profile.emailPlaceholder')}
                  value={profile.email}
                  onChange={handleInputChange}
                  disabled={true}
                />
              </TextField>
              <TextField className="w-full" label={t('profile.phoneNumber')}>
                <TextField.Input
                  name="phone"
                  placeholder={t('profile.phonePlaceholder')}
                  value={profile.phone}
                  onChange={handleInputChange}
                />
              </TextField>
              <TextField className="w-full" label={t('profile.clinicName')}>
                <TextField.Input
                  name="clinic"
                  placeholder={t('profile.clinicPlaceholder')}
                  value={profile.clinic}
                  onChange={handleInputChange}
                />
              </TextField>
              <TextField className="w-full" label={t('profile.clinicAddress')}>
                <TextField.Input
                  name="address"
                  placeholder={t('profile.addressPlaceholder')}
                  value={profile.address}
                  onChange={handleInputChange}
                />
              </TextField>
              <div className="flex w-full items-center justify-end gap-3">
                <Button
                  className="w-auto"
                  variant="neutral-secondary"
                  onClick={() => navigate(-1)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="w-auto"
                  onClick={handleSave}
                  loading={saving}
                >
                  {t('profile.saveChanges')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ProfilePage;
