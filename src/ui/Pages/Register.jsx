import React from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { LinkButton } from '../../ui/components/LinkButton';
import { Link, useNavigate } from 'react-router';
import {
  FeatherChevronRight,
  FeatherPhone,
  FeatherUserSquare,
} from '@subframe/core';
import { FeatherBuilding } from '@subframe/core';
import { FeatherMail } from '@subframe/core';
import { FeatherLock } from '@subframe/core';
import { FeatherCheck } from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import { useState } from 'react';
import Error from '../components/Error';
import toast from 'react-hot-toast';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_Password: '',
    full_Name: '',
    phone: '',
    clinic: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirm_Password ||
      !formData.full_Name ||
      !formData.phone ||
      !formData.clinic
    ) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirm_Password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_Name,
            phone: formData.phone,
            clinic: formData.clinic,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Check if email confirmation is required
      if (data?.user && data?.session) {
        // Auto sign-in (email confirmation not required)
        console.log('User registered and signed in:', data.user);
        toast.success('Registered and signed in. Redirecting...');
        navigate('/app/dashboard');
      } else {
        // Email confirmation required
        toast.success(
          'Registration successful! Please check your email to confirm your account.'
        );
        // Clear the form
        setFormData({
          email: '',
          password: '',
          confirm_Password: '',
          full_Name: '',
          phone: '',
          clinic: '',
        });
      }
    } catch (error) {
      console.error('Error during registration:', error.message);
      toast.error(error.message);
      setError(null);
    } finally {
      setLoading(false);
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
            Welcome to 3DA – Let’s Build Beautiful Smiles Together
          </span>
          <span className="text-heading-2 text-lg font-heading-2 text-neutral-400">
            <ul>
              <li>Start submitting aligner cases in minutes</li>
              <li>Enjoy a seamless digital workflow</li>
              <li>Get support from real dental professionals</li>
              <li>Track every step — from scan to delivery</li>
            </ul>
          </span>
        </div>
        <img
          className="w-full flex-none rounded-lg"
          src="https://res.cloudinary.com/subframe/image/upload/v1751625442/uploads/16759/dtha82l1njnh9ohl9b9k.jpg"
        />
      </div>

      <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-6 self-stretch border-l border-solid border-neutral-border px-12 py-12">
        <div className="flex w-full max-w-[448px] flex-col items-start justify-center gap-8">
          <div className="flex w-full flex-col items-start gap-1">
            <span className="w-full text-heading-2 font-heading-2 text-default-font">
              Get started today
            </span>
            <div className="flex w-full flex-wrap items-start gap-2">
              <span className="text-body font-body text-subtext-color">
                Already have an account?
              </span>
              <Link to="/login">
                <LinkButton variant="brand" iconRight={<FeatherChevronRight />}>
                  Sign In
                </LinkButton>
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col items-start justify-center gap-4"
          >
            {error && <Error error={error} />}

            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherUserSquare />}
            >
              <TextField.Input
                id="full_Name"
                type="text"
                autoComplete="name"
                value={formData.full_Name}
                onChange={handleChange}
                placeholder="Full Name"
                name="full_Name"
                required
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherBuilding />}
            >
              <TextField.Input
                id="clinic"
                type="text"
                value={formData.clinic}
                onChange={handleChange}
                placeholder="Clinic Name"
                name="clinic"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherPhone />}
            >
              <TextField.Input
                id="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                name="phone"
                type="tel"
                required
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherMail />}
            >
              <TextField.Input
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherLock />}
            >
              <TextField.Input
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                placeholder="Password"
                required
                name="password"
                minLength="8"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherLock />}
            >
              <TextField.Input
                id="confirm_Password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Password Confirmation"
                value={formData.confirm_Password}
                onChange={handleChange}
                name="confirm_Password"
                minLength="8"
              />
            </TextField>
            <div className="flex w-full flex-wrap items-start gap-2 px-2 py-2 mobile:flex-col mobile:flex-wrap mobile:gap-2">
              <div className="flex grow shrink-0 basis-0 flex-col items-start justify-center gap-2">
                <div className="flex items-center gap-1">
                  <FeatherCheck className="text-body font-body text-success-700" />
                  <span className="text-caption font-caption text-default-font">
                    Mixed case letters
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FeatherCheck className="text-body font-body text-success-700" />
                  <span className="text-caption font-caption text-default-font">
                    Minimum 8 characters
                  </span>
                </div>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start justify-center gap-2">
                <div className="flex items-center gap-1">
                  <FeatherCheck className="text-body font-body text-success-700" />
                  <span className="text-caption font-caption text-default-font">
                    Includes special characters
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FeatherCheck className="text-body font-body text-success-700" />
                  <span className="text-caption font-caption text-default-font">
                    Does not contain email
                  </span>
                </div>
              </div>
            </div>
            <Button
              disabled={loading}
              type="submit"
              size="large"
              className="bg-sky-600 hover:bg-sky-500 active:bg-sky-600 w-full flex-none"
            >
              {loading ? 'Submitting...' : 'Sign Up'}
            </Button>
          </form>
          <div className="flex flex-wrap items-start gap-1">
            <span className="text-caption font-caption text-subtext-color">
              By signing up you agree to the
            </span>
            <LinkButton variant="brand" size="small">
              Terms of Service
            </LinkButton>
            <span className="text-caption font-caption text-subtext-color">
              and
            </span>
            <LinkButton variant="brand" size="small">
              Privacy Policy
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
