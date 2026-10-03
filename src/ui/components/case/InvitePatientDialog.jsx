import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import Error from '../Error';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { FeatherUserPlus, FeatherCopy, FeatherRefreshCw } from '@subframe/core';

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

export default function InvitePatientDialog({
  isOpen,
  onClose,
  caseData,
  onInvited,
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [invited, setInvited] = useState(false);

  // On open, check whether this case already has a patient account — if so,
  // show its current password instead of suggesting a brand new one. The
  // password column isn't directly selectable (see get_patient_current_password
  // in the migration), so this goes through the RPC rather than a table read.
  useEffect(() => {
    if (!isOpen) return;
    setInvited(false);
    setError(null);
    setLoadingExisting(true);
    supabase
      .rpc('get_patient_current_password', { p_case_id: caseData.id })
      .then(({ data, error: rpcError }) => {
        if (rpcError) {
          console.error('Failed to check existing invite:', rpcError);
          setPassword(generatePassword());
          setIsExisting(false);
        } else if (data) {
          setPassword(data);
          setIsExisting(true);
        } else {
          setPassword(generatePassword());
          setIsExisting(false);
        }
        setLoadingExisting(false);
      });
  }, [isOpen, caseData.id]);

  const handleClose = () => {
    onClose();
  };

  const handleInvite = async () => {
    if (password.length < 8) {
      setError(t('casePage.invitePatient.passwordTooShort'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'invite-patient',
        {
          body: { caseId: caseData.id, password },
        },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setInvited(true);
      toast.success(t('casePage.invitePatient.success'));
      onInvited?.();
    } catch (e) {
      setError(e.message || t('casePage.invitePatient.failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const copyCredentials = () => {
    navigator.clipboard.writeText(
      `${t('casePage.invitePatient.caseNumberLogin')}: ${caseData.id}\n${t('casePage.invitePatient.password')}: ${password}`,
    );
    toast.success(t('casePage.invitePatient.copied'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Content className="w-full max-w-md p-6">
        <div className="flex w-full flex-col gap-4">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {isExisting
              ? t('casePage.invitePatient.credentialsTitle')
              : t('casePage.invitePatient.title')}
          </span>

          {error && <Error error={error} />}

          {loadingExisting ? (
            <span className="text-body font-body text-subtext-color">
              {t('common.loading')}
            </span>
          ) : !invited ? (
            <>
              <p className="text-body font-body text-subtext-color">
                {isExisting
                  ? t('casePage.invitePatient.existingDescription', {
                      caseId: caseData.id,
                    })
                  : t('casePage.invitePatient.description', {
                      caseId: caseData.id,
                    })}
              </p>

              <div className="flex w-full flex-col gap-1">
                <span className="text-caption font-caption text-subtext-color">
                  {t('casePage.invitePatient.caseNumberLogin')}
                </span>
                <span className="text-body-bold font-body-bold text-default-font">
                  {caseData.id}
                </span>
              </div>

              <div className="flex w-full flex-col gap-1">
                <div className="flex w-full items-center justify-between">
                  <span className="text-caption font-caption text-subtext-color">
                    {t('casePage.invitePatient.password')}
                  </span>
                  {isExisting && (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-caption font-caption text-sky-600"
                      onClick={() => {
                        setPassword(generatePassword());
                        setIsExisting(false);
                      }}
                    >
                      <FeatherRefreshCw className="w-3 h-3" />
                      {t('casePage.invitePatient.generateNew')}
                    </button>
                  )}
                </div>
                <input
                  className="w-full rounded-md border border-solid border-neutral-border px-3 py-2 text-body font-body"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="neutral-secondary"
                  onClick={handleClose}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  icon={<FeatherUserPlus />}
                  onClick={handleInvite}
                  disabled={saving}
                >
                  {saving
                    ? t('casePage.invitePatient.inviting')
                    : isExisting
                      ? t('casePage.invitePatient.updatePassword')
                      : t('casePage.invitePatient.invite')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-body font-body text-subtext-color">
                {t('casePage.invitePatient.shareInstructions')}
              </p>
              <div className="flex w-full flex-col gap-2 rounded-md border border-solid border-neutral-border p-4">
                <span>
                  {t('casePage.invitePatient.caseNumberLogin')}:{' '}
                  <b>{caseData.id}</b>
                </span>
                <span>
                  {t('casePage.invitePatient.password')}: <b>{password}</b>
                </span>
              </div>
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="neutral-secondary"
                  icon={<FeatherCopy />}
                  onClick={copyCredentials}
                >
                  {t('casePage.invitePatient.copy')}
                </Button>
                <Button onClick={handleClose}>{t('common.done')}</Button>
              </div>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
