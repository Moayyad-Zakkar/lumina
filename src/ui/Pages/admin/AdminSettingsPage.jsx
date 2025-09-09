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

  // Case Acceptance Fee state
  const [feeId, setFeeId] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [updatingFee, setUpdatingFee] = useState(false);

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

      // Load current Case Acceptance Fee
      const { data: feeRows, error: feeError } = await supabase
        .from('services')
        .select('id, price, is_active')
        .eq('type', 'acceptance_fee')
        .order('created_at', { ascending: false })
        .limit(1);
      if (!feeError && Array.isArray(feeRows) && feeRows.length > 0) {
        setFeeId(feeRows[0].id);
        setFeeAmount(String(feeRows[0].price ?? ''));
      }
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

  const handleUpdateAcceptanceFee = async () => {
    const parsed = Number.parseFloat(String(feeAmount).trim());
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid non-negative number for the fee.');
      return;
    }
    setUpdatingFee(true);
    try {
      if (feeId) {
        const { error } = await supabase
          .from('services')
          .update({ price: parsed, is_active: true })
          .eq('id', feeId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert([
            {
              type: 'acceptance_fee',
              name: 'Case Acceptance Fee',
              price: parsed,
              is_active: true,
            },
          ])
          .select('id')
          .single();
        if (error) throw error;
        setFeeId(data?.id || null);
      }
      toast.success('Case acceptance fee updated');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to update acceptance fee');
    } finally {
      setUpdatingFee(false);
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
          <div className="flex w-full flex-col items-start gap-6">
            <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-md border border-neutral-border bg-default-background p-6 shadow-sm">
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Case Study Fee
                </span>
                <span className="block text-body font-body text-subtext-color mb-4">
                  This fee is charged when a new case is accepted.
                </span>
                <div className="flex items-end justify-between gap-3">
                  <TextField className="h-auto w-60" label="Amount (USD)">
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      id="feeAmount"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                    />
                  </TextField>
                  <Button
                    className="w-auto"
                    loading={updatingFee}
                    onClick={handleUpdateAcceptanceFee}
                  >
                    Save Fee
                  </Button>
                </div>
              </div>
              <div className="rounded-md border border-neutral-border bg-default-background p-6 shadow-sm">
                <AdminOptionManager
                  type="printing_method"
                  label="Printing Methods"
                />
              </div>
              <div className="rounded-md border border-neutral-border bg-default-background p-6 shadow-sm">
                <AdminOptionManager
                  type="aligners_material"
                  label="Aligner Materials"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminSettingsPage;
