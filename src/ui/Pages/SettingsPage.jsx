import React, { useState } from 'react';
import { TextField } from '../../ui/components/TextField';
import { Button } from '../../ui/components/Button';
import { Loader } from '../../ui/components/Loader';
import supabase from '../../helper/supabaseClient';

import toast from 'react-hot-toast';

import { Switch } from '../../ui/components/Switch';

function SettingsPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /*
  // remove the comments when activating the notifications through email or sms
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
  });
  */

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleEmailUpdate = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email updated successfully.');
    }

    setIsLoading(false);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully.');
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="flex w-full max-w-[576px] flex-col items-start gap-12">
        {/* Header */}
        <div className="flex w-full flex-col items-center">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Settings
          </span>
          <span className="text-body font-body text-subtext-color">
            Manage your account and preferences
          </span>
        </div>

        {/* Email Section */}
        <div className="flex w-full flex-col gap-6 rounded-md border border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <div>
            <span className="text-heading-3 font-heading-3 text-default-font">
              Update Email
            </span>
            <span className="block text-body text-subtext-color">
              Change the email address you use to sign in
            </span>
          </div>
          <TextField className="w-full" label="New Email">
            <TextField.Input
              type="email"
              placeholder="Enter new email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </TextField>
          <Button onClick={handleEmailUpdate} disabled={isLoading}>
            {isLoading ? <Loader /> : 'Update Email'}
          </Button>
        </div>

        {/* Password Section */}
        <div className="flex w-full flex-col gap-6 rounded-md border border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <div>
            <span className="text-heading-3 font-heading-3 text-default-font">
              Change Password
            </span>
            <span className="block text-body text-subtext-color">
              Set a new password for your account
            </span>
          </div>
          <TextField className="w-full" label="New Password">
            <TextField.Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </TextField>
          <Button onClick={handlePasswordUpdate} disabled={isLoading}>
            {isLoading ? <Loader /> : 'Change Password'}
          </Button>
        </div>

        {/* Notifications Section */}
        {/*
        <div className="flex w-full flex-col gap-6 rounded-md border border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <div>
            <span className="text-heading-3 font-heading-3 text-default-font">
              Notifications
            </span>
            <span className="block text-body text-subtext-color">
              Choose how you want to be notified
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-default-font">Email Alerts</span>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, email: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-default-font">SMS Alerts</span>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, sms: checked }))
              }
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => toast.success('Preferences saved')}
          >
            Save Notification Preferences
          </Button>
        </div>
        */}
      </div>
    </>
  );
}

export default SettingsPage;
