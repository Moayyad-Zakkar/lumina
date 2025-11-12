import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs } from '../../components/Tabs';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import AdminHeadline from '../../components/AdminHeadline';
import AdminOptionManager from '../../components/AdminOptionManager';
import Error from '../../components/Error';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

function AdminSettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('security');
  const [error, setError] = useState(null);

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
      toast.error(t('settings.errors.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.errors.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('settings.errors.passwordTooShort'));
      return;
    }

    setUpdatingPassword(true);
    setError(null);
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
        toast.error(t('settings.errors.incorrectPassword'));
        setUpdatingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        toast.error('Failed to update password');
        setError(updateError.message);
      } else {
        toast.success(t('settings.success.passwordUpdated'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error updating password');
      setError(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateContact = async () => {
    setSavingContact(true);
    setError(null);
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
          setError(emailError.message);
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
        toast.success(t('settings.success.contactUpdated'));
      } else if (!phoneError && !emailUpdatedOk) {
        toast.success(t('settings.success.phoneUpdated'));
      } else if (phoneError && emailUpdatedOk) {
        toast.error('Failed to update phone');
        setError(phoneError.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error updating contact info');
      setError(err.message);
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
    setError(null);
    try {
      if (feeId) {
        const { error: updateError } = await supabase
          .from('services')
          .update({ price: parsed, is_active: true })
          .eq('id', feeId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
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
        if (insertError) throw insertError;
        setFeeId(data?.id || null);
      }
      toast.success(t('settings.success.feeUpdated'));
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to update acceptance fee');
      setError(e.message);
    } finally {
      setUpdatingFee(false);
    }
  };

  return (
    <>
      {error && <Error error={error} />}

      <AdminHeadline submit={false}>
        {t('settings.adminSettings')}
      </AdminHeadline>

      <p className="text-body font-body text-subtext-color">
        {t('settings.adminSubtitle')}
      </p>

      <Tabs>
        <Tabs.Item
          active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
        >
          {t('settings.accountSecurity')}
        </Tabs.Item>
        <Tabs.Item
          active={activeTab === 'services'}
          onClick={() => setActiveTab('services')}
        >
          {t('settings.serviceManagement')}
        </Tabs.Item>
      </Tabs>

      {activeTab === 'security' && (
        <>
          {/* Language Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('settings.language')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <LanguageSwitcher variant="cards" />
            </div>
          </div>

          {/* Password Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('settings.accountSecurity')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <div>
                <span className="text-heading-3 font-heading-3 text-default-font">
                  {t('settings.changePassword')}
                </span>
                <span className="block text-body font-body text-subtext-color">
                  {t('settings.passwordDescription')}
                </span>
              </div>
              <TextField
                className="h-auto w-full flex-none"
                label={t('settings.currentPassword')}
              >
                <TextField.Input
                  type="password"
                  placeholder={t('settings.currentPasswordPlaceholder')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </TextField>
              <TextField
                className="h-auto w-full flex-none"
                label={t('settings.newPassword')}
              >
                <TextField.Input
                  type="password"
                  placeholder={t('settings.passwordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </TextField>
              <TextField
                className="h-auto w-full flex-none"
                label={t('settings.confirmPassword')}
              >
                <TextField.Input
                  type="password"
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </TextField>
              <Button
                className="w-auto"
                onClick={handleUpdatePassword}
                loading={updatingPassword}
              >
                {t('settings.updatePassword')}
              </Button>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('settings.contactInformation')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <TextField
                className="h-auto w-full flex-none"
                label={t('settings.emailAddress')}
              >
                <TextField.Input
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </TextField>
              <TextField
                className="h-auto w-full flex-none"
                label={t('settings.phoneNumber')}
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
                {t('settings.updateContactInfo')}
              </Button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'services' && (
        <>
          {/* Case Study Fee Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('settings.caseStudyFee')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <div>
                <span className="text-heading-3 font-heading-3 text-default-font">
                  {t('settings.caseStudyFee')}
                </span>
                <span className="block text-body font-body text-subtext-color">
                  {t('settings.caseStudyFeeDescription')}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <TextField
                  className="h-auto w-60"
                  label={t('settings.amountUSD')}
                >
                  <TextField.Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                  />
                </TextField>
                <Button
                  className="w-auto"
                  loading={updatingFee}
                  onClick={handleUpdateAcceptanceFee}
                >
                  {t('settings.saveFee')}
                </Button>
              </div>
            </div>
          </div>

          {/* Aligner Materials Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('settings.services')}
            </span>
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
              <AdminOptionManager
                type="aligners_material"
                label={t('settings.alignerMaterials')}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default AdminSettingsPage;
