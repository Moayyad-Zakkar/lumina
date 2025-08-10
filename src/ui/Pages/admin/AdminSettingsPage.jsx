import React, { useEffect, useState } from 'react';
import { Tabs } from '../../components/Tabs';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import AdminOptionManager from '../../components/AdminOptionManager';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('security');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        toast.error('Failed to fetch user');
        return;
      }
      setEmail(user?.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();
      setPhone(profile?.phone || '');
    };
    load();
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error('Current password is incorrect');
        setUpdatingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast.error('Failed to update password');
      } else {
        toast.success('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateContact = async () => {
    setSavingContact(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update email in auth
      let emailUpdatedOk = true;
      if (email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          emailUpdatedOk = false;
          toast.error('Failed to update email');
        } else {
          toast.success('Email updated. Confirmation may be required.');
        }
      }

      // Update phone in profile
      const { error: phoneError } = await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', user.id);

      if (!phoneError && emailUpdatedOk) {
        toast.success('Contact info updated');
      } else if (!phoneError && !emailUpdatedOk) {
        toast.success('Phone updated');
      } else if (phoneError && emailUpdatedOk) {
        toast.error('Failed to update phone');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error updating contact info');
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <div className="container max-w-none flex grow shrink-0 basis-0 flex-col items-center gap-6 self-stretch bg-default-background py-12 shadow-sm">
      <div className="flex w-full max-w-[768px] flex-col items-start gap-12">
        <div className="flex w-full flex-col items-start gap-1">
          <span className="w-full text-heading-2 font-heading-2 text-default-font">
            Admin Settings
          </span>
          <span className="w-full text-body font-body text-subtext-color">
            Manage your account security and service options
          </span>
        </div>

        <Tabs>
          <Tabs.Item
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          >
            Account Security
          </Tabs.Item>
          <Tabs.Item
            active={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
          >
            Service Management
          </Tabs.Item>
        </Tabs>

        {activeTab === 'security' ? (
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Account Security
              </span>
              <div className="flex w-full flex-col items-start gap-4">
                <TextField
                  className="h-auto w-full flex-none"
                  label="Current Password"
                >
                  <TextField.Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </TextField>
                <TextField
                  className="h-auto w-full flex-none"
                  label="New Password"
                >
                  <TextField.Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </TextField>
                <TextField
                  className="h-auto w-full flex-none"
                  label="Confirm Password"
                >
                  <TextField.Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </TextField>
                <Button
                  className="w-auto"
                  onClick={handleUpdatePassword}
                  loading={updatingPassword}
                >
                  Update Password
                </Button>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Contact Information
              </span>
              <div className="flex w-full flex-col items-start gap-4">
                <TextField
                  className="h-auto w-full flex-none"
                  label="Email Address"
                >
                  <TextField.Input
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </TextField>
                <TextField
                  className="h-auto w-full flex-none"
                  label="Phone Number"
                >
                  <TextField.Input
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </TextField>
                <Button
                  className="w-auto"
                  onClick={handleUpdateContact}
                  loading={savingContact}
                >
                  Update Contact Info
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'services' ? (
          <div className="flex w-full flex-col items-start gap-10">
            <div className="w-full">
              <AdminOptionManager
                type="printing_method"
                label="Printing Methods"
              />
            </div>
            <div className="w-full">
              <AdminOptionManager
                type="aligners_material"
                label="Aligner Materials"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminSettingsPage;
