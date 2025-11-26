import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import {
  FeatherGrid,
  FeatherClock,
  FeatherDollarSign,
  FeatherPlusCircle,
  FeatherCalculator,
  FeatherEye,
} from '@subframe/core';
import { Button } from '../Button';
import IPRChartViewer from '../IPRChartViewer';

const TreatmentPlanDisplay = ({ caseData, showPlanSection, caseHasViewer }) => {
  const { t } = useTranslation();
  const [isIPROpen, setIsIPROpen] = useState(false);

  if (!showPlanSection) return null;

  const handleViewerClick = () => {
    // Open the viewer in a new tab with the case ID
    const viewerUrl = `/case-viewer/${caseData.id}`;
    window.open(viewerUrl, '_blank');
  };

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full flex-wrap items-start gap-6">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          <DataFieldHorizontal
            icon={<FeatherGrid />}
            label={t('casePage.treatmentPlan.upperJawAligners')}
          >
            <Badge>
              {caseData.upper_jaw_aligners ?? '—'}{' '}
              {t('casePage.treatmentPlan.aligners')}
            </Badge>
          </DataFieldHorizontal>
          <DataFieldHorizontal
            icon={<FeatherGrid />}
            label={t('casePage.treatmentPlan.lowerJawAligners')}
          >
            <Badge>
              {caseData.lower_jaw_aligners ?? '—'}{' '}
              {t('casePage.treatmentPlan.aligners')}
            </Badge>
          </DataFieldHorizontal>
          <DataFieldHorizontal
            icon={<FeatherClock />}
            label={t('casePage.treatmentPlan.estimatedDuration')}
          >
            <span className="whitespace-nowrap text-body font-body text-default-font">
              {caseData.estimated_duration_months ?? '—'}{' '}
              {t('casePage.treatmentPlan.months')}
            </span>
          </DataFieldHorizontal>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          <DataFieldHorizontal
            icon={<FeatherDollarSign />}
            label={t('casePage.treatmentPlan.caseStudyFee')}
          >
            <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
              $
              {caseData.case_study_fee
                ? parseFloat(caseData.case_study_fee).toFixed(2)
                : '0'}
            </span>
          </DataFieldHorizontal>
          <DataFieldHorizontal
            icon={<FeatherGrid />}
            label={t('casePage.treatmentPlan.alignersPrice')}
          >
            <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
              $
              {caseData.aligners_price
                ? parseFloat(caseData.aligners_price).toFixed(2)
                : '0'}
            </span>
          </DataFieldHorizontal>
          <DataFieldHorizontal
            icon={<FeatherPlusCircle />}
            label={t('casePage.treatmentPlan.deliveryCharges')}
          >
            <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
              $
              {caseData.delivery_charges
                ? parseFloat(caseData.delivery_charges).toFixed(2)
                : '0'}
            </span>
          </DataFieldHorizontal>
          <DataFieldHorizontal
            icon={<FeatherCalculator />}
            label={t('casePage.treatmentPlan.totalCost')}
          >
            <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
              $
              {caseData.total_cost
                ? parseFloat(caseData.total_cost).toFixed(2)
                : '0'}
            </span>
          </DataFieldHorizontal>
        </div>
      </div>

      {/* View 3DA Viewer Button */}
      {caseHasViewer && (
        <div className="flex w-full justify-end">
          <Button
            onClick={handleViewerClick}
            icon={<FeatherEye />}
            className="w-auto"
          >
            {t('casePage.openViewer')}
          </Button>
        </div>
      )}

      {/* View IPR Button */}
      {caseData.ipr_data && Object.keys(caseData.ipr_data).length > 0 && (
        <div className="mt-8">
          <Button
            onClick={() => setIsIPROpen(true)}
            icon={<FeatherEye />}
            className="w-auto"
          >
            {t('casePage.treatmentPlan.viewIPRChart')}
          </Button>
          <IPRChartViewer
            toothStatus={caseData.tooth_status || {}}
            iprData={caseData.ipr_data}
            onClose={() => setIsIPROpen(false)}
            isOpen={isIPROpen}
          />
        </div>
      )}

      {/* Admin Note Section */}
      {caseData.admin_note && (
        <>
          <div className="flex w-full items-center justify-between">
            <span className="text-heading-3 font-heading-3 text-default-font">
              {t('casePage.treatmentPlan.adminNotes')}
            </span>
          </div>
          <div className="w-full">
            <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
              <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                {caseData.admin_note}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TreatmentPlanDisplay;
