import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import supabase from '../../helper/supabaseClient';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError(null);
      toast.error(t('resetPassword.errors.emailRequired'));
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      toast.success(t('resetPassword.success.instructionsSent'));
      setSuccessMessage(null);
      setEmail('');
    } catch (error) {
      console.error('Error resetting password:', error.message);
      toast.error(error.message);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {t('resetPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {/* Inline messages removed in favor of toasts */}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('resetPassword.emailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
              placeholder={t('resetPassword.emailPlaceholder')}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              size="large"
              className="bg-brand-600 hover:bg-brand-500 active:bg-brand-600 w-full flex-none"
            >
              {loading
                ? t('resetPassword.sending')
                : t('resetPassword.sendButton')}
            </Button>
          </div>

          <div className="text-sm text-center">
            <Link
              to="/login"
              className="font-medium text-brand-600 hover:text-brand-500 active:text-brand-600"
            >
              {t('resetPassword.backToSignIn')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
