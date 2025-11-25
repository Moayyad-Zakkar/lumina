import React from 'react';
import { Button } from '../Button';

const ManufacturingProgress = ({
  currentStatus,
  isDisabled,
  handleStatusTransition,
}) => {
  // Only show for approved cases and beyond
  if (
    ![
      'approved',
      'in_production',
      'ready_for_delivery',
      'delivered',
      'completed',
    ].includes(currentStatus)
  ) {
    return null;
  }

  const getStatusButton = () => {
    switch (currentStatus) {
      case 'approved':
        return (
          <Button
            disabled={isDisabled}
            onClick={() => handleStatusTransition('in_production')}
          >
            Start Production
          </Button>
        );
      case 'in_production':
        return (
          <Button
            disabled={isDisabled}
            onClick={() => handleStatusTransition('ready_for_delivery')}
          >
            Mark Ready for Delivery
          </Button>
        );
      case 'ready_for_delivery':
        return (
          <Button
            disabled={isDisabled}
            onClick={() => handleStatusTransition('delivered')}
          >
            Mark Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'approved':
        return 'Treatment plan approved. Ready to begin production.';
      case 'in_production':
        return 'Aligners are currently being manufactured.';
      case 'ready_for_delivery':
        return 'Manufacturing complete. Aligners are ready to be shipped.';
      case 'delivered':
        return 'The aligners have been delivered to the doctor. The doctor can mark the case as completed when finished.';
      case 'completed':
        return 'Case completed successfully.';
      default:
        return 'Update the case status as you progress through manufacturing and delivery.';
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        Manufacturing Progress
      </span>
      <div className="flex w-full items-center justify-between">
        <span className="text-body font-body text-subtext-color">
          {getStatusMessage()}
        </span>
        <div className="flex items-center gap-2">{getStatusButton()}</div>
      </div>
    </div>
  );
};

export default ManufacturingProgress;
