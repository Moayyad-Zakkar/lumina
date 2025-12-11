import React from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { LinkButton } from '../../ui/components/LinkButton';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import supabase from '../../helper/supabaseClient';
import SignUpRequestDialog from '../components/SignUpRequestDialog';
import { isAdminRole } from '../../helper/auth';

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

      // Fetch user role from app_metadata
      const userRole = data.user?.app_metadata?.role || 'user';

      // Redirect based on user role
      if (isAdminRole(userRole)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }

      console.log('User signed in:', data.user);
    } catch (error) {
      console.error('Error signing in:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpRequest = async (formData) => {
    try {
      const { error } = await supabase.from('signup_requests').insert([
        {
          full_name: formData.full_name,
          email: formData.email,
          clinic: formData.clinic,
          phone: formData.phone,
          address: formData.address,
          language_preference: formData.language_preference,
          status: 'pending',
        },
      ]);

      if (error) throw error;
    } catch (error) {
      throw new Error(error.message || t('login.errors.submitFailed'));
    }
  };

  return (
    <div className="flex w-full h-screen items-stretch">
      <div className="flex grow shrink-0 basis-0 flex-col items-start justify-between bg-brand-600 px-12 py-12">
        <Link to="/">
          <img className="h-8 flex-none object-cover" src="./logo-2.png" />
        </Link>
        <div className="flex flex-col items-start gap-2">
          <span className="text-heading-1 text-2xl font-medium font-heading-1 text-white">
            {t('login.welcomeBack')}
          </span>
          <span className="text-heading-2 text-xl font-heading-2 text-neutral-200">
            {t('login.subtitle')}
          </span>
        </div>
        <img
          className="w-full flex-none rounded-lg"
          src="https://res.cloudinary.com/subframe/image/upload/v1751625442/uploads/16759/dtha82l1njnh9ohl9b9k.jpg"
        />
      </div>
      <div className="flex grow shrink-0 basis-0 items-center justify-center bg-default-background px-12">
        <div className="flex max-w-[384px] grow shrink-0 basis-0 flex-col items-center justify-center gap-8">
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-heading-2 text-xl font-medium font-heading-2 text-default-font">
              {t('auth.signIn')}
            </span>
            <span className="text-body font-body text-subtext-color">
              {t('login.enterCredentials')}
            </span>
          </div>
          <form
            onSubmit={handleSignIn}
            className="flex w-full flex-col items-start gap-6"
          >
            {error && (
              <div className="rounded-md bg-red-50 w-full p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            <TextField
              className="h-auto w-full flex-none"
              label={t('auth.email')}
              helpText=""
            >
              <TextField.Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label={t('auth.password')}
              helpText=""
            >
              <TextField.Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
              />
            </TextField>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-500 active:bg-brand-600 w-full flex-none"
              size="large"
            >
              {loading ? t('login.signingIn') : t('auth.signIn')}
            </Button>
          </form>
          <div className="flex flex-wrap items-start gap-1">
            <span className="text-body font-body text-default-font">
              {t('auth.dontHaveAccount')}
            </span>

            <LinkButton
              variant="neutral"
              className="text-sky-600"
              onClick={() => setShowSignUpDialog(true)}
            >
              {t('login.requestAccess')}
            </LinkButton>
          </div>
          <div className="flex flex-wrap items-start gap-1">
            <span className="text-body font-body text-default-font">
              {t('login.forgotPasswordText')}
            </span>
            <Link to="/reset-password">
              <LinkButton variant="neutral" className="text-sky-600">
                {t('login.resetPassword')}
              </LinkButton>
            </Link>
          </div>
        </div>

        <SignUpRequestDialog
          isOpen={showSignUpDialog}
          onClose={() => setShowSignUpDialog(false)}
          onSubmit={handleSignUpRequest}
        />
      </div>
    </div>
  );
}
export default Login;
