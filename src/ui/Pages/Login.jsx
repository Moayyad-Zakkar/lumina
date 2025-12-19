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

      const userRole = data.user?.app_metadata?.role || 'user';
      if (isAdminRole(userRole)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (error) {
      setError(error.message);
    } finally {
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
    <div className="flex w-full min-h-screen items-stretch bg-default-background">
      {/* Left Section - Hidden on Mobile */}
      <div className="hidden md:flex grow shrink-0 basis-0 flex-col items-start justify-between bg-brand-600 px-12 py-12">
        <Link to="/">
          <img
            className="h-8 flex-none object-cover"
            src="./logo-2.png"
            alt="Logo"
          />
        </Link>
        <div className="flex flex-col items-start gap-2">
          <span className="text-2xl font-medium text-white">
            {t('login.welcomeBack')}
          </span>
          <span className="text-xl text-neutral-200">
            {t('login.subtitle')}
          </span>
        </div>
        <img
          className="w-full flex-none rounded-lg"
          src="https://res.cloudinary.com/subframe/image/upload/v1751625442/uploads/16759/dtha82l1njnh9ohl9b9k.jpg"
          alt="Illustration"
        />
      </div>

      {/* Right Section - Main Login Form */}
      <div className="flex grow shrink-0 basis-0 items-center justify-center px-6 py-8 md:px-12">
        <div className="flex w-full max-w-[384px] flex-col items-center justify-center gap-8">
          {/* Mobile Logo - Visible only on small screens */}
          <div className="md:hidden mb-4">
            <Link to="/">
              <img
                className="h-20 object-contain"
                src="./logo.png"
                alt="Lumina Logo"
              />
            </Link>
          </div>

          <div className="flex w-full flex-col items-start gap-2 text-center md:text-left">
            <span className="w-full text-xl font-medium text-default-font">
              {t('auth.signIn')}
            </span>
            <span className="w-full text-body text-subtext-color">
              {t('login.enterCredentials')}
            </span>
          </div>

          <form
            onSubmit={handleSignIn}
            className="flex w-full flex-col items-start gap-6"
          >
            {error && (
              <div className="rounded-md bg-red-50 w-full p-4">
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
              className="bg-brand-600 w-full"
              size="large"
            >
              {loading ? t('login.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 text-sm">
            <div className="flex flex-wrap justify-center gap-1">
              <span className="text-default-font">
                {t('auth.dontHaveAccount')}
              </span>
              <LinkButton
                variant="neutral"
                className="text-sky-600 p-0 h-auto"
                onClick={() => setShowSignUpDialog(true)}
              >
                {t('login.requestAccess')}
              </LinkButton>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <span className="text-default-font">
                {t('login.forgotPasswordText')}
              </span>
              <Link to="/reset-password">
                <LinkButton
                  variant="neutral"
                  className="text-sky-600 p-0 h-auto"
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
      </div>
    </div>
  );
}
export default Login;
