import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useCaseStatus = (initialStatus) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(initialStatus);

  const alertContent = useMemo(() => {
    switch (status) {
      case 'submitted':
        return {
          title: t('caseStatus.submitted.title'),
          description: t('caseStatus.submitted.description'),
        };
      case 'awaiting_user_approval':
        return {
          title: t('caseStatus.awaitingUserApproval.title'),
          description: t('caseStatus.awaitingUserApproval.description'),
        };
      case 'approved':
        return {
          title: t('caseStatus.approved.title'),
          description: t('caseStatus.approved.description'),
        };
      case 'in_production':
        return {
          title: t('caseStatus.inProduction.title'),
          description: t('caseStatus.inProduction.description'),
        };
      case 'ready_for_delivery':
        return {
          title: t('caseStatus.readyForDelivery.title'),
          description: t('caseStatus.readyForDelivery.description'),
        };
      case 'delivered':
        return {
          title: t('caseStatus.delivered.title'),
          description: t('caseStatus.delivered.description'),
        };
      case 'completed':
        return {
          title: t('caseStatus.completed.title'),
          description: t('caseStatus.completed.description'),
        };
      case 'rejected':
        return {
          title: t('caseStatus.rejected.title'),
          description: t('caseStatus.rejected.description'),
          variant: 'destructive',
        };
      default:
        return {
          title: t('caseStatus.default.title'),
          description: t('caseStatus.default.description'),
        };
    }
  }, [status, t]);

  const showPlanSection = useMemo(() => {
    return [
      'user_rejected',
      'awaiting_user_approval',
      'approved',
      'in_production',
      'ready_for_delivery',
      'delivered',
      'completed',
    ].includes(status);
  }, [status]);

  const isPlanEditAllowed = useMemo(() => {
    return !['ready_for_delivery', 'delivered', 'completed'].includes(status);
  }, [status]);

  return {
    status,
    setStatus,
    alertContent,
    showPlanSection,
    isPlanEditAllowed,
  };
};
