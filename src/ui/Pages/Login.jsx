import React, { useState } from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { LinkButton } from '../../ui/components/LinkButton';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import AuthScreen from '../components/AuthScreen';
import supabase from '../../helper/supabaseClient';
import SignUpRequestDialog from '../components/SignUpRequestDialog';
import { getHomePathForRole } from '../../helper/auth';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('login.errors.emptyFields'));
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role || data.user?.app_metadata?.role || null;
      navigate(getHomePathForRole(userRole));
      // Don't set loading to false here - let the component unmount
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignUpRequest = async (formData) => {
    try {
      const { error } = await supabase.from('signup_requests').insert([
        {
          ...formData,
          status: 'pending',
        },
      ]);
      if (error) throw error;
    } catch (error) {
      throw new Error(error.message || t('login.errors.submitFailed'));
    }
  };

  return (
    <AuthScreen backTo="/" backLabel={t('login.changeRole')}>
        <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-brand-600">{t('auth.doctorSignIn')}</h1>
            <p className="text-body text-subtext-color">{t('login.enterCredentials')}</p>
          </div>

          <form
            onSubmit={handleSignIn}
            className="flex w-full flex-col items-start gap-5 rounded-[28px] bg-[#f7ebf6] px-5 py-6 shadow-sm"
          >
            {error && (
              <div className="w-full rounded-2xl bg-red-50 p-4">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            )}
            <TextField className="w-full" label={t('auth.email')}>
              <TextField.Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
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

          <div className="flex flex-col items-center gap-3 text-sm">
            <div className="flex flex-wrap justify-center gap-1">
              <span className="text-subtext-color">{t('auth.dontHaveAccount')}</span>
              <LinkButton
                variant="brand"
                size="small"
                className="h-auto p-0 font-semibold text-brand-600"
                onClick={() => setShowSignUpDialog(true)}
              >
                {t('login.requestAccess')}
              </LinkButton>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <span className="text-subtext-color">{t('login.forgotPasswordText')}</span>
              <Link to="/reset-password">
                <LinkButton
                  variant="brand"
                  size="small"
                  className="h-auto p-0 font-semibold text-brand-600"
                >
                  {t('login.resetPassword')}
                </LinkButton>
              </Link>
            </div>
          </div>
        </div>

      <SignUpRequestDialog
        isOpen={showSignUpDialog}
        onClose={() => setShowSignUpDialog(false)}
        onSubmit={handleSignUpRequest}
      />
    </AuthScreen>
  );
}

export default Login;