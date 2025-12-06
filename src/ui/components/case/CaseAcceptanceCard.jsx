import React from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Alert } from '../Alert';
import { FeatherCheck, FeatherX, FeatherDollarSign } from '@subframe/core';
import { useTranslation } from 'react-i18next';

const CaseAcceptanceCard = ({
  currentStatus,
  caseStudyFee,
  setCaseStudyFee,
  saving,
  acceptCase,
  handleDecline,
}) => {
  // Show this card for submitted cases (for acceptance) and accepted cases (for display only)
  //if (currentStatus !== 'submitted' && currentStatus !== 'accepted')
  const { t } = useTranslation();
  if (currentStatus !== 'submitted') return null;

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherCheck className="h-5 w-5 text-brand-600" />
        <span className="text-heading-3 font-heading-3 text-default-font">
          {currentStatus === 'submitted'
            ? t('casePage.caseAcceptanceCard.title')
            : t('casePage.caseAcceptanceCard.caseStudyFee')}
        </span>
      </div>

      {currentStatus === 'submitted' ? (
        <>
          <Alert
            variant="brand"
            title={t('casePage.alerts.submitted.title')}
            description={t('casePage.caseAcceptanceCard.description')}
          />

          <div className="flex w-full flex-col items-start gap-4">
            <div className="w-full max-w-xs">
              <TextField label={t('casePage.caseAcceptanceCard.caseStudyFee')}>
                <TextField.Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={caseStudyFee}
                  onChange={(e) => setCaseStudyFee(e.target.value)}
                  placeholder="0.00"
                />
              </TextField>
            </div>

            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                {t('casePage.alerts.submitted.description')}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive-secondary"
                  disabled={saving}
                  onClick={handleDecline}
                  icon={<FeatherX />}
                >
                  {t('casePage.caseAcceptanceCard.declineCase')}
                </Button>
                <Button
                  disabled={saving}
                  onClick={acceptCase}
                  icon={<FeatherCheck />}
                >
                  {t('casePage.caseAcceptanceCard.acceptCase')}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Alert
            variant="success"
            title={t('casePage.caseAcceptanceCard.caseAcceptedAlertTitle')}
            description={t('casePage.caseAcceptanceCard.caseAcceptedAlert')}
          />

          <div className="flex w-full flex-col items-start gap-4">
            <div className="w-full max-w-xs">
              <TextField
                label={t('casePage.caseAcceptanceCard.caseStudyFee')}
                disabled
              >
                <TextField.Input
                  type="number"
                  value={caseStudyFee}
                  placeholder="0.00"
                  disabled
                />
              </TextField>
            </div>

            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                {t('casePage.caseAcceptanceCard.caseStudyFeeSet')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseAcceptanceCard;
