/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { LinkButton } from '../components/LinkButton';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router';
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

function Register() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const [formError, setFormError] = useState('');

  if (actionData?.error) {
    setFormError(actionData.error);
  }

  const isSubmitting = navigation.state === 'submitting';

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
          {formError && <div>{formError}</div>}

          <Form
            method="post"
            onSubmit={(e) => {
              // Basic form validation
              const form = e.currentTarget;
              const password = form.elements.password.value;
              const confirmPassword = form.elements.confirm_password.value;

              if (password !== confirmPassword) {
                e.preventDefault();
                setFormError('Passwords do not match');
                return;
              }
            }}
            className="flex w-full flex-col items-start justify-center gap-4"
          >
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherUserSquare />}
            >
              <TextField.Input
                disabled={isSubmitting}
                placeholder="Full Name"
                name="full_name"
                required
                autoComplete="on"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherBuilding />}
            >
              <TextField.Input
                disabled={isSubmitting}
                placeholder="Clinic Name"
                name="clinic"
                autoComplete="on"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherPhone />}
            >
              <TextField.Input
                disabled={isSubmitting}
                placeholder="Phone Number"
                name="phone"
                type="tel"
                required
                autoComplete="on"
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label=""
              helpText=""
              icon={<FeatherMail />}
            >
              <TextField.Input
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                type="password"
                placeholder="Password"
                required
                name="password"
                autoComplete="password"
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
                disabled={isSubmitting}
                type="password"
                placeholder="Password Confirmation"
                required
                name="confirm_password"
                autoComplete="password"
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
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : 'Sign Up'}
            </Button>
          </Form>
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

// This is the action function to be used with React Router
export async function action({ request }) {
  try {
    // Get form data
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    const fullName = formData.get('full_name');
    const clinic = formData.get('clinic') || null;
    const phone = formData.get('phone') || null;

    // Register the user with Supabase Auth
    // Include all metadata fields that the trigger function expects
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          clinic: clinic,
          phone: phone,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { error: authError.message };
    }

    // Check if user was created successfully
    if (!authData?.user?.id) {
      return { error: 'Failed to create user account' };
    }

    // If email confirmation is required in your Supabase project settings
    if (authData.user && !authData.session) {
      return {
        message:
          'Registration successful! Please check your email to confirm your account before logging in.',
      };
    }

    // If email confirmation is not required, the user is already signed in
    // and we can redirect to dashboard
    return redirect('/app/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export default Register;
