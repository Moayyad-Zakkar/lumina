import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../components/Table';
import { useLoaderData, useNavigate, useNavigation } from 'react-router';

import { Loader } from '../components/Loader';
import Headline from '../components/Headline';
import Error from '../components/Error';
import { capitalizeFirstSafe } from '../../helper/formatText';
import CaseStatusBadge from '../components/CaseStatusBadge';
import { CaseCardBase } from '../components/CaseCardBase';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';
import DoctorBillingStats from '../components/billing/DoctorBillingStats';
import { useIsMobile } from '../../hooks/useIsMobile';

// Small stat tile used in the mobile summary row
function MiniStat({ label, value, valueClassName = 'text-default-font' }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1 rounded-md border border-solid border-neutral-border bg-default-background px-3 py-3">
      <span className="w-full truncate text-caption font-caption text-subtext-color">
        {label}
      </span>
      <span className={`text-heading-2 font-heading-2 ${valueClassName}`}>
        {value === null || value === undefined ? (
          <div className="flex h-8 items-center">
            <Loader size="small" />
          </div>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function UserDashboard() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const {
    totalCases,
    recentCases,
    casesError,
    submittedCases,
    completedCases,
    profile,
  } = useLoaderData();

  const { totalDue, loading: billingLoading } = useDoctorBillingData();

  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === 'loading';

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : '-';

  // Mobile: tappable cards
  const MobileCasesList = () => (
    <div className="flex w-full flex-col gap-3">
      {isLoading ? (
        <div className="flex min-h-[100px] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : recentCases.length === 0 ? (
        <div className="py-8 text-center text-neutral-500">
          {t('dashboard.noCases')}
        </div>
      ) : (
        recentCases.map((caseItem) => (
          <button
            key={caseItem.id}
            type="button"
            onClick={() => navigate(`/app/cases/${caseItem.id}`)}
            className="w-full text-start"
          >
            <CaseCardBase
              title={`${capitalizeFirstSafe(
                caseItem.first_name,
              )} ${capitalizeFirstSafe(caseItem.last_name)}`}
              meta={`CASE-${caseItem.id} · ${formatDate(caseItem.created_at)}`}
              right={<CaseStatusBadge status={caseItem.status} />}
            />
          </button>
        ))
      )}
    </div>
  );

  // Desktop: table
  const DesktopCasesTable = () => (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>{t('cases.patientName')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.status')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.submissionDate')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.caseId')}</Table.HeaderCell>
        </Table.HeaderRow>
      }
    >
      {isLoading ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <div className="flex h-full min-h-[100px] w-full items-center justify-center">
              <Loader size="medium" />
            </div>
          </Table.Cell>
        </Table.Row>
      ) : recentCases.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <div className="py-8 text-center">
              <span className="text-neutral-500">{t('dashboard.noCases')}</span>
            </div>
          </Table.Cell>
        </Table.Row>
      ) : (
        recentCases.map((caseItem) => (
          <Table.Row
            key={caseItem.id}
            clickable={true}
            onClick={() => navigate(`/app/cases/${caseItem.id}`)}
          >
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {capitalizeFirstSafe(caseItem.first_name)}{' '}
                {capitalizeFirstSafe(caseItem.last_name)}
              </span>
            </Table.Cell>
            <Table.Cell>
              <CaseStatusBadge status={caseItem.status} />
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {formatDate(caseItem.created_at)}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                CASE-{caseItem.id}
              </span>
            </Table.Cell>
          </Table.Row>
        ))
      )}
    </Table>
  );

  return (
    <>
      {casesError && <Error error={casesError} />}

      <Headline>
        {t('dashboard.hello')} {profile.full_name}
      </Headline>

      {/* Stats Overview */}
      {isMobile ? (
        <div className="grid w-full grid-cols-3 gap-2">
          <MiniStat label={t('dashboard.totalCases')} value={totalCases} />
          <MiniStat
            label={t('dashboard.pendingReview')}
            value={submittedCases}
            valueClassName="text-warning-700"
          />
          <MiniStat
            label={t('dashboard.completedBy3DA')}
            value={completedCases}
            valueClassName="text-success-700"
          />
        </div>
      ) : billingLoading ? (
        <div className="flex h-full min-h-[150px] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : (
        <DoctorBillingStats
          totalDue={totalDue}
          isDashboard={true}
          submittedCases={submittedCases}
          completedCases={completedCases}
          totalCases={totalCases}
        />
      )}

      {/* Recent Cases Section */}
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('dashboard.recentCases')}
        </span>
      </div>

      {isMobile ? <MobileCasesList /> : <DesktopCasesTable />}
    </>
  );
}

export default UserDashboard;