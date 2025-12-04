import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';

const ManufacturingProgress = ({
  currentStatus,
  isDisabled,
  handleStatusTransition,
}) => {
  const { t } = useTranslation();

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
            {t('manufacturingProgress.buttons.startProduction')}
          </Button>
        );
      case 'in_production':
        return (
          <Button
            disabled={isDisabled}
            onClick={() => handleStatusTransition('ready_for_delivery')}
          >
            {t('manufacturingProgress.buttons.markReady')}
          </Button>
        );
      case 'ready_for_delivery':
        return (
          <Button
            disabled={isDisabled}
            onClick={() => handleStatusTransition('delivered')}
          >
            {t('manufacturingProgress.buttons.markDelivered')}
          </Button>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'approved':
        return t('manufacturingProgress.messages.approved');
      case 'in_production':
        return t('manufacturingProgress.messages.inProduction');
      case 'ready_for_delivery':
        return t('manufacturingProgress.messages.readyForDelivery');
      case 'delivered':
        return t('manufacturingProgress.messages.delivered');
      case 'completed':
        return t('manufacturingProgress.messages.completed');
      default:
        return t('manufacturingProgress.messages.default');
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('manufacturingProgress.title')}
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
