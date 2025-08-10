import { Badge } from './Badge';

const statusDisplayText = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  rejected: 'Rejected',
  awaiting_patient_approval: 'Awaiting Approval',
  patient_rejected: 'Rejected by Patient',
  awaiting_user_approval: 'Awaiting Approval',
  user_rejected: 'Rejected by Doctor',
  approved: 'Approved',
  in_production: 'In Production',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
};

const statusBadgeVariant = {
  completed: 'success',
  rejected: 'error',
  patient_rejected: 'error',
  user_rejected: 'error',
  awaiting_patient_approval: 'warning',
  awaiting_user_approval: 'warning',
};

export default function CaseStatusBadge({ status }) {
  return (
    <Badge variant={statusBadgeVariant[status]}>
      {statusDisplayText[status] || status}
    </Badge>
  );
}
