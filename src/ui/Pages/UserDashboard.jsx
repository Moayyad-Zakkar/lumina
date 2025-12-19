import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../components/TextField';
import { Table } from '../components/Table';
import { useLoaderData, useNavigate, useNavigation } from 'react-router';
import { FeatherSearch } from '@subframe/core';

import { Loader } from '../components/Loader';
import Headline from '../components/Headline';
import Error from '../components/Error';
import { capitalizeFirstSafe } from '../../helper/formatText';
import CaseStatusBadge from '../components/CaseStatusBadge';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';
import DoctorBillingStats from '../components/billing/DoctorBillingStats';

function UserDashboard() {
  const { t } = useTranslation();
  const {
    totalCases,
    recentCases,
    casesError,
    submittedCases,
    completedCases,
    profile,
  } = useLoaderData();

  const {
    totalDue,
    totalPaid,
    loading: billingLoading,
  } = useDoctorBillingData();

  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === 'loading';

  return (
    <>
      {casesError && <Error error={casesError} />}

      <Headline>
        {t('dashboard.hello')} {profile.full_name}
      </Headline>
      {/* Banner */}
      {/*
      <div className="w-full h-[100px] md:h-[150px] overflow-hidden rounded-xl mb-6">
        <img
          src="/banner-2.jpg"
          alt="Dashboard Banner"
          className="w-full h-full object-cover"
        />
      </div>
*/}

      {/* Stats Overview */}
      {billingLoading ? (
        <div className="flex w-full h-full min-h-[150px] justify-center items-center">
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
        <div className="flex-shrink-0 max-w-[300px] min-w-[200px]">
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder={t('dashboard.searchCases')}
              value=""
            />
          </TextField>
        </div>
      </div>

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
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : recentCases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <div className="text-center py-8">
                <span className="text-neutral-500">
                  {t('dashboard.noCases')}
                </span>
              </div>
            </Table.Cell>
          </Table.Row>
        ) : (
          recentCases.map((caseItem) => (
            <Table.Row
              key={caseItem.id}
              clickable={true}
              onClick={() => {
                navigate(`/app/cases/${caseItem.id}`);
              }}
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
                  {caseItem.created_at
                    ? new Date(caseItem.created_at).toLocaleDateString()
                    : '-'}
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
    </>
  );
}

export default UserDashboard;
