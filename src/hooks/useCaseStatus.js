import { useState, useMemo } from 'react';

export const useCaseStatus = (initialStatus) => {
  const [status, setStatus] = useState(initialStatus);

  const alertContent = useMemo(() => {
    switch (status) {
      case 'submitted':
        return {
          title: 'Waiting for 3DA Acceptance',
          description:
            'Your case is submitted successfully, please wait for 3DA acceptance',
        };
      case 'awaiting_user_approval':
        return {
          title: 'Treatment Plan Ready for Approval',
          description:
            'Please review the aligners count and estimated duration, then approve or decline the plan.',
        };
      case 'approved':
        return {
          title: 'Treatment Plan Approved',
          description:
            'Your treatment plan has been approved. Production will start soon.',
        };
      case 'in_production':
        return {
          title: 'Aligners Are In Production',
          description:
            'Your aligners are being manufactured. You will be notified when they are ready for delivery.',
        };
      case 'ready_for_delivery':
        return {
          title: 'Aligners Ready for Delivery',
          description:
            'Your aligners are ready. 3DA will contact you to arrange pickup or delivery.',
        };
      case 'delivered':
        return {
          title: 'Aligners Delivered',
          description:
            'You have received the aligners. Please advise your patient to follow the wear schedule and instructions.',
        };
      case 'completed':
        return {
          title: 'Treatment Completed',
          description: 'The treatment is complete. Thank you for choosing us!',
        };
      case 'rejected':
        return {
          title: 'Case has been declined',
          description:
            'This case was declined and is no longer active. You can undo this action if needed.',
          variant: 'destructive',
        };
      default:
        return {
          title: 'Case Updates',
          description:
            'We will notify you here when there are updates to your treatment plan.',
        };
    }
  }, [status]);

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
