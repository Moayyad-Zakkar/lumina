import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { Loader } from '../../ui/components/Loader';
import Headline from '../../ui/components/Headline';
import Error from '../../ui/components/Error';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../../ui/components/LanguageSwitcher';

function SettingsPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleEmailUpdate = async () => {
    if (!isValidEmail(email)) {
      toast.error(t('settings.errors.invalidEmail'));
      return;
    }

    setIsLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ email });

    if (updateError) {
      toast.error(updateError.message);
      setError(updateError.message);
    } else {
      toast.success(t('settings.success.emailUpdated'));
      setEmail('');
    }

    setIsLoading(false);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      toast.error(t('settings.errors.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error(updateError.message);
      setError(updateError.message);
    } else {
      toast.success(t('settings.success.passwordUpdated'));
      setNewPassword('');
    }

    setIsLoading(false);
  };

  return (
    <>
      {error && <Error error={error} />}

      <Headline submit={false}>{t('settings.title')}</Headline>

      <p className="text-body font-body text-subtext-color">
        {t('settings.subtitle')}
      </p>

      {/* Language Section */}
      <div className="flex w-full flex-col items-start gap-6">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('settings.language')}
        </span>
        <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
          <LanguageSwitcher variant="cards" />
        </div>
      </div>

      {/* Email Section */}
      <div className="flex w-full flex-col items-start gap-6">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('settings.updateEmail')}
        </span>
        <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
          <div>
            <span className="text-heading-3 font-heading-3 text-default-font">
              {t('settings.updateEmail')}
            </span>
            <span className="block text-body font-body text-subtext-color">
              {t('settings.emailDescription')}
            </span>
          </div>
          <TextField className="w-full" label={t('settings.newEmail')}>
            <TextField.Input
              type="email"
              placeholder={t('settings.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </TextField>
          <Button
            className="w-auto"
            onClick={handleEmailUpdate}
            disabled={isLoading}
            loading={isLoading}
          >
            {t('settings.updateEmail')}
          </Button>
        </div>
      </div>

      {/* Password Section */}
      <div className="flex w-full flex-col items-start gap-6">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('settings.changePassword')}
        </span>
        <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
          <div>
            <span className="text-heading-3 font-heading-3 text-default-font">
              {t('settings.changePassword')}
            </span>
            <span className="block text-body font-body text-subtext-color">
              {t('settings.passwordDescription')}
            </span>
          </div>
          <TextField className="w-full" label={t('settings.newPassword')}>
            <TextField.Input
              type="password"
              placeholder={t('settings.passwordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </TextField>
          <Button
            className="w-auto"
            onClick={handlePasswordUpdate}
            disabled={isLoading}
            loading={isLoading}
          >
            {t('settings.changePassword')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
