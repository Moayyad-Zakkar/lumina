import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherStar } from '@subframe/core';

const CaseSatisfactionDisplay = ({ caseData }) => {
  const { t } = useTranslation();

  if (!caseData.satisfaction_rating) {
    return null;
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FeatherStar
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-neutral-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex items-center gap-2">
        <FeatherStar className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        <span className="text-heading-3 font-heading-3 text-default-font">
          {t('casePage.satisfaction.display.title')}
        </span>
      </div>

      <div className="flex w-full flex-col gap-4">
        {/* Rating Display */}
        <div className="flex items-center gap-3">
          <span className="text-body-bold font-body-bold text-default-font">
            {t('casePage.satisfaction.display.rating')}:
          </span>
          {renderStars(caseData.satisfaction_rating)}
          <span className="text-body font-body text-subtext-color">
            ({caseData.satisfaction_rating}/5)
          </span>
        </div>

        {/* Message Display */}
        {caseData.satisfaction_message && (
          <>
            <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />
            <div className="flex flex-col gap-2">
              <span className="text-body-bold font-body-bold text-default-font">
                {t('casePage.satisfaction.display.feedback')}:
              </span>
              <div className="w-full bg-neutral-50 border border-neutral-border rounded-md p-4">
                <p className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.satisfaction_message}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Completion Date */}
        {caseData.completed_at && (
          <div className="flex items-center gap-2 text-body font-body text-subtext-color">
            <span>
              {t('casePage.satisfaction.display.completedOn')}:{' '}
              {new Date(caseData.completed_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseSatisfactionDisplay;
