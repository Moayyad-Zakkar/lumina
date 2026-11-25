import React, { useState } from 'react';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import AuthScreen from '../components/AuthScreen';
import supabase from '../../helper/supabaseClient';
import { getHomePathForRole } from '../../helper/auth';
import { unregisterPush } from '../../helper/pushNotifications';


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
        unregisterPush()
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
    <AuthScreen backTo="/" backLabel={t('patientLogin.changeRole')}>
        <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-brand-600">{t('patientLogin.title')}</h1>
            <p className="text-body text-subtext-color">{t('patientLogin.subtitle')}</p>
          </div>

          <form
            onSubmit={handleSignIn}
            className="flex w-full flex-col items-start gap-5 rounded-[28px] bg-[#f3f4e4] px-5 py-6 shadow-sm"
          >
            {error && (
              <div className="w-full rounded-2xl bg-red-50 p-4">
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600"
              size="large"
            >
              {loading ? t('login.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
    </AuthScreen>
  );
}

export default PatientLogin;