import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Check if user is authenticated via recovery token
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      // If no session or not in recovery mode, redirect to sign in
      if (!data?.session || !data?.session?.user?.aal === 'aal1') {
        navigate('/signin');
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!password || !confirmPassword) {
      setError(null);
      toast.error('Please enter both fields');
      return;
    }

    if (password !== confirmPassword) {
      setError(null);
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(null);
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      toast.success('Password updated successfully!');
      setSuccessMessage(null);

      // Clear form
      setPassword('');
      setConfirmPassword('');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating password:', error.message);
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
            Update your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        {/* Inline messages removed in favor of toasts */}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 active:bg-sky-600 w-full flex-none"
              size="large"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
