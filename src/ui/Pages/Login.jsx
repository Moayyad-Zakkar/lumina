import React from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { LinkButton } from '../../ui/components/LinkButton';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import supabase from '../../helper/supabaseClient';
import SignUpRequestDialog from '../components/SignUpRequestDialog';
import { isAdminRole } from '../../helper/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
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

  /*
  // the following don't take into consideration the user-role (admin, standard user)
  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
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

      // Successful login
      console.log('User signed in:', data.user);
      navigate('/app/dashboard'); // Redirect to dashboard or home page
    } catch (error) {
      console.error('Error signing in:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleSignUpRequest = async (formData) => {
    try {
      const { error } = await supabase.from('signup_requests').insert([
        {
          full_name: formData.full_name,
          email: formData.email,
          clinic: formData.clinic,
          phone: formData.phone,
          address: formData.address,
          status: 'pending',
        },
      ]);

      if (error) throw error;
    } catch (error) {
      throw new Error(error.message || 'Failed to submit request');
    }
  };

  return (
    <div className="flex w-full h-screen items-stretch">
      <div className="flex grow shrink-0 basis-0 flex-col items-start justify-between bg-neutral-900 px-12 py-12">
        <Link to="/">
          <img
            className="h-8 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1751625200/uploads/16759/jpef3z487npyabdeeipn.png"
          />
        </Link>
        <div className="flex flex-col items-start gap-2">
          <span className="text-heading-1 text-2xl font-medium font-heading-1 text-white">
            Welcome back
          </span>
          <span className="text-heading-2 text-xl font-heading-2 text-neutral-400">
            Sign in to view and submit your 3DA cases
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
              Sign in
            </span>
            <span className="text-body font-body text-subtext-color">
              Enter your credentials to access your account
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
              label="Email"
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
                placeholder="Enter your email"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label="Password"
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
                placeholder="Enter your password"
              />
            </TextField>
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 active:bg-sky-600 w-full flex-none"
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <div className="flex flex-wrap items-start gap-1">
            <span className="text-body font-body text-default-font">
              Don&#39;t have an account?
            </span>

            <LinkButton
              variant="brand"
              className="text-sky-800"
              onClick={() => setShowSignUpDialog(true)}
            >
              Request Access
            </LinkButton>
          </div>
          <div className="flex flex-wrap items-start gap-1">
            <span className="text-body font-body text-default-font">
              Forgot your password?
            </span>
            <Link to="/reset-password">
              <LinkButton variant="brand" className="text-sky-800">
                Reset Password
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
