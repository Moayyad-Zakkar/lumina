import React, { useState, useEffect } from 'react';
import { Badge } from './Badge';
import { FeatherClock } from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import { useTranslation } from 'react-i18next';

const RefinementHistory = ({ caseData }) => {
  const { t } = useTranslation();
  const [refinements, setRefinements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefinements();
  }, [caseData?.id]);

  const fetchRefinements = async () => {
    try {
      setLoading(true);

      // Fetch child cases (refinements) for this case
      const { data: childCases, error: childCasesError } = await supabase
        .from('cases')
        .select('*')
        .eq('parent_case_id', caseData.id)
        .order('created_at', { ascending: false });

      if (childCasesError) throw childCasesError;

      setRefinements(
        childCases.map((case_) => ({ ...case_, type: 'refinement' }))
      );
    } catch (error) {
      console.error('Error fetching refinements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (item) => {
    // For refinement cases, use the case status
    switch (item.status) {
      case 'submitted':
        return (
          <Badge variant="neutral">
            {t('casePage.refinementHistory.status.submitted')}
          </Badge>
        );
      case 'awaiting_user_approval':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.awaitingApproval')}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.approved')}
          </Badge>
        );
      case 'in_production':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.inProduction')}
          </Badge>
        );
      case 'ready_for_delivery':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.readyForDelivery')}
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.delivered')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="brand">
            {t('casePage.refinementHistory.status.completed')}
          </Badge>
        );
      default:
        return <Badge variant="neutral">{item.status}</Badge>;
    }
  };

  const getItemTitle = (item) => {
    return t('casePage.refinementHistory.caseTitle', { id: item.id });
  };

  const getItemDescription = (item) => {
    return t('casePage.refinementHistory.caseDescription', {
      number: item.refinement_number || 1,
      material:
        item.aligner_material ||
        t('casePage.refinementHistory.standardMaterial'),
      reason:
        item.refinement_reason || t('casePage.refinementHistory.noReason'),
    });
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <span className="text-heading-3 font-heading-3 text-default-font">
          {t('casePage.refinementHistory.title')}
        </span>
        <div className="text-body font-body text-subtext-color">
          {t('casePage.refinementHistory.loading')}
        </div>
      </div>
    );
  }

  if (refinements.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('casePage.refinementHistory.title')}
      </span>

      <div className="flex w-full flex-col gap-3">
        {refinements.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-start justify-between gap-4 rounded-md border border-solid border-neutral-border p-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  {getItemTitle(item)}
                </span>
                {getStatusBadge(item)}
              </div>
              <p className="text-body font-body text-subtext-color">
                {getItemDescription(item)}
              </p>
              <div className="flex items-center gap-4 text-sm text-subtext-color">
                <div className="flex items-center gap-1">
                  <FeatherClock size={14} />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <a
              href={`/app/cases/${item.id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('casePage.refinementHistory.viewCase')}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefinementHistory;
