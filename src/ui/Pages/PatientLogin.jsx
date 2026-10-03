import React, { useState } from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { LinkButton } from '../../ui/components/LinkButton';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import supabase from '../../helper/supabaseClient';
import { getHomePathForRole } from '../../helper/auth';

// Mirrors synthesizePhone() in the invite-patient edge function: the case
// number is encoded as a synthetic phone so Supabase's native phone auth can
// be used without a real phone number ever being involved.
function resolveLoginPhone(caseNumberInput) {
  const digitsOnly = caseNumberInput.trim().replace(/\D/g, '');
  return `+999${digitsOnly.padStart(10, '0')}`;
}

function PatientLogin() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError(t('patientLogin.errors.emptyFields'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        phone: resolveLoginPhone(identifier),
        password,
      });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'patient') {
        await supabase.auth.signOut();
        throw new Error(t('patientLogin.errors.notAPatientAccount'));
      }

      navigate(getHomePathForRole(profile.role));
      // Don't set loading to false here - let the component unmount
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen items-stretch bg-default-background">
      <div className="hidden md:flex h-screen grow shrink-0 basis-0 flex-col items-end justify-between bg-brand-600">
        <img className="object-cover h-full w-full object-center" src="./bg-intro.png" alt="Logo" />
      </div>

      <div className="flex grow shrink-0 basis-0 items-center justify-center px-6 py-8 md:px-12">
        <div className="flex w-full max-w-[384px] flex-col items-center justify-center gap-8">
          <div className="md:hidden mb-4">
            <Link to="/">
              <img className="h-20 object-contain" src="./logo.png" alt="Lumina Logo" />
            </Link>
          </div>

          <div className="flex w-full flex-col items-start gap-2 text-center md:text-start">
            <span className="w-full text-xl font-medium text-default-font">
              {t('patientLogin.title')}
            </span>
            <span className="w-full text-body text-subtext-color">
              {t('patientLogin.subtitle')}
            </span>
          </div>

          <form onSubmit={handleSignIn} className="flex w-full flex-col items-start gap-6">
            {error && (
              <div className="rounded-md bg-red-50 w-full p-4">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            )}
            <TextField className="w-full" label={t('patientLogin.identifierLabel')}>
              <TextField.Input
                type="text"
                inputMode="numeric"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('patientLogin.identifierPlaceholder')}
              />
            </TextField>
            <TextField className="w-full" label={t('auth.password')}>
              <TextField.Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
              />
            </TextField>
            <Button type="submit" disabled={loading} className="bg-brand-600 w-full" size="large">
              {loading ? t('login.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="flex flex-wrap justify-center gap-1 text-sm">
            <span className="text-default-font">{t('patientLogin.areYouDoctor')}</span>
            <Link to="/login">
              <LinkButton variant="brand" size="small" className="text-sky-600 p-0 h-auto">
                {t('patientLogin.goToDoctorLogin')}
              </LinkButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientLogin;