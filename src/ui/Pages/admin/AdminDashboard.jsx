import { useLoaderData, useNavigate, useNavigation } from 'react-router';
import { useTranslation } from 'react-i18next';
import CaseStatusBadge from '../../components/CaseStatusBadge';
import { Table } from '../../components/Table';
import AdminHeadline from '../../components/AdminHeadline';
import { Loader } from '../../components/Loader';
import { TextField } from '../../components/TextField';
import { Avatar } from '../../components/Avatar';
import { FeatherSearch } from '@subframe/core';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import BillingStats from '../../components/billing/BillingStats';
import { useBillingData } from '../../../hooks/useBillingData';
import { useUserRole } from '../../../helper/useUserRole';
import { isSuperAdmin } from '../../../helper/auth';
import Error from '../../components/Error';
import { useIsMobile } from '../../../hooks/useIsMobile';

function AdminDashboard() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const {
    totalCases,
    recentCases,
    casesError,
    submittedCases,
    completedCases,
  } = useLoaderData();

  const { role } = useUserRole();
  const isSuperAdminUser = isSuperAdmin(role);

  const {
    totalEarnings,
    totalDue,
    totalExpenses,
    loading: billingLoading,
  } = useBillingData();

  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === 'loading';

  return (
    <>
      {casesError && <Error error={casesError} />}

      <AdminHeadline submit={true}>{t('dashboard.title')}</AdminHeadline>

      {/* Stats Overview */}
      {!isMobile && (
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-subtext-color">
              {t('dashboard.totalCases')}
            </span>
            <span className="text-heading-2 font-heading-2 text-default-font">
              {totalCases === null ? (
                <div className="flex items-center h-8">
                  <Loader size="small" />
                </div>
              ) : (
                totalCases
              )}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-subtext-color">
              {t('dashboard.pendingReview')}
            </span>
            <span className="text-heading-2 font-heading-2 text-warning-700">
              {submittedCases === null ? (
                <div className="flex items-center h-8">
                  <Loader size="small" />
                </div>
              ) : (
                submittedCases
              )}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-subtext-color">
              {t('dashboard.completedBy3DA')}
            </span>
            <span className="text-heading-2 font-heading-2 text-success-700">
              {completedCases === null ? (
                <div className="flex items-center h-8">
                  <Loader size="small" />
                </div>
              ) : (
                completedCases
              )}
            </span>
          </div>
        </div>
      )}

      {/* Recent Cases Section */}
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('dashboard.recentCases')}
        </span>
        {/*
        <div className="flex-shrink-0 max-w-[300px] min-w-[200px]">
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder={t('dashboard.searchCases')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </TextField>
        </div>
        */}
      </div>

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>{t('cases.patient')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.doctor')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.clinic')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.phone')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.status')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.submissionDate')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.caseId')}</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {isLoading ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : recentCases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
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
                navigate(`/admin/cases/${caseItem.id}`);
              }}
            >
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  {capitalizeFirstSafe(caseItem.first_name)}{' '}
                  {capitalizeFirstSafe(caseItem.last_name)}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="small"
                    image={caseItem.profiles?.avatar_url || undefined}
                  >
                    {!caseItem.profiles?.avatar_url && (
                      <>
                        {capitalizeFirstSafe(
                          caseItem.profiles?.full_name?.split(' ')[0]?.[0]
                        )}
                        {capitalizeFirstSafe(
                          caseItem.profiles?.full_name
                            ?.split(' ')
                            .slice(-1)[0]?.[0]
                        )}
                      </>
                    )}
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-neutral-700">
                    {capitalizeFirstSafe(caseItem.profiles?.full_name) || '-'}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {caseItem.profiles?.clinic || '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {caseItem.profiles?.phone || '-'}
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
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {caseItem.id ? `CASE-${caseItem.id}` : '-'}
                </span>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>

      {/* Payment Overview Section - Only visible to Super Admin */}
      {isSuperAdminUser && (
        <>
          <span className="text-heading-2 font-heading-2 text-default-font">
            {t('dashboard.paymentOverview')}
          </span>

          {billingLoading ? (
            <div className="flex w-full h-full min-h-[150px] justify-center items-center">
              <Loader size="medium" />
            </div>
          ) : (
            <BillingStats
              totalEarnings={totalEarnings}
              totalDue={totalDue}
              totalExpenses={totalExpenses}
              withButtons={false}
            />
          )}
        </>
      )}
    </>
  );
}

export default AdminDashboard;
