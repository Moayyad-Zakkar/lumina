import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';

const statusBadgeVariant = {
  completed: 'success',
  accepted: 'success',
  approved: 'success',
  delivered: 'success',
  rejected: 'error',
  patient_rejected: 'error',
  user_rejected: 'error',
  awaiting_patient_approval: 'warning',
  awaiting_user_approval: 'warning',
};

export default function CaseStatusBadge({ status }) {
  const { t } = useTranslation();

  const getStatusText = (status) => {
    const statusMap = {
      submitted: t('caseStatusBadge.submitted'),
      accepted: t('caseStatusBadge.accepted'),
      under_review: t('caseStatusBadge.underReview'),
      rejected: t('caseStatusBadge.rejected'),
      awaiting_patient_approval: t('caseStatusBadge.awaitingApproval'),
      patient_rejected: t('caseStatusBadge.patientRejected'),
      awaiting_user_approval: t('caseStatusBadge.awaitingApproval'),
      user_rejected: t('caseStatusBadge.userRejected'),
      approved: t('caseStatusBadge.approved'),
      in_production: t('caseStatusBadge.inProduction'),
      ready_for_delivery: t('caseStatusBadge.readyForDelivery'),
      delivered: t('caseStatusBadge.delivered'),
      completed: t('caseStatusBadge.completed'),
    };

    return statusMap[status] || status;
  };

  return (
    <Badge variant={statusBadgeVariant[status]}>{getStatusText(status)}</Badge>
  );
}
