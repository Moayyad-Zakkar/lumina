import { useLoaderData, useNavigate, useNavigation } from 'react-router';
import CaseStatusBadge from '../../components/CaseStatusBadge';
import { Table } from '../../components/Table';
import AdminHeadline from '../../components/AdminHeadline';
import { Loader } from '../../components/Loader';
import { TextField } from '../../components/TextField';
import { Avatar } from '../../components/Avatar';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import BillingStats from '../../components/billing/BillingStats';
import { useBillingData } from '../../../hooks/useBillingData';

function AdminDashboard() {
  const {
    totalCases,
    recentCases,
    casesError,
    submittedCases,
    completedCases,
  } = useLoaderData();

  const { totalEarnings, totalDue, totalExpenses } = useBillingData();

  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === 'loading';

  return (
    <>
      <AdminHeadline submit={true}>Dashboard</AdminHeadline>
      <div className="flex w-full flex-wrap items-start gap-4">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            TOTAL CASES
          </span>
          <span className="text-heading-2 font-heading-2 text-default-font">
            {totalCases === null ? <Loader size="small" /> : totalCases}
          </span>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            PENDING REVIEW
          </span>
          <span className="text-heading-2 font-heading-2 text-warning-700">
            {submittedCases}
          </span>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            COMPLETED BY 3DA
          </span>
          <span className="text-heading-2 font-heading-2 text-success-700">
            {completedCases}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Recent Cases
          </span>
          <TextField className="h-auto w-64 flex-none" label="" helpText="">
            <TextField.Input placeholder="Search cases..." value="" />
          </TextField>
        </div>
        <Table
          header={
            <Table.HeaderRow>
              <Table.HeaderCell>Patient</Table.HeaderCell>
              <Table.HeaderCell>Doctor</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Submitted</Table.HeaderCell>
              <Table.HeaderCell>Case ID</Table.HeaderCell>
            </Table.HeaderRow>
          }
        >
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                  <Loader size="medium" />
                </div>
              </Table.Cell>
            </Table.Row>
          ) : casesError ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="text-red-500 py-4">{casesError}</div>
              </Table.Cell>
            </Table.Row>
          ) : recentCases.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="text-neutral-500 py-4">No recent cases.</div>
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
                  {capitalizeFirstSafe(caseItem.first_name)}{' '}
                  {capitalizeFirstSafe(caseItem.last_name)}
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
                    <span>
                      {capitalizeFirstSafe(caseItem.profiles?.full_name) || '-'}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>{caseItem.profiles?.clinic || '-'}</Table.Cell>
                <Table.Cell>{caseItem.profiles?.phone || '-'}</Table.Cell>
                <Table.Cell>
                  <CaseStatusBadge status={caseItem.status} />
                </Table.Cell>
                <Table.Cell>
                  {caseItem.created_at
                    ? new Date(caseItem.created_at).toLocaleDateString()
                    : '-'}
                </Table.Cell>
                <Table.Cell>
                  {caseItem.id ? `CASE-${caseItem.id}` : '-'}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table>
      </div>

      <BillingStats
        totalEarnings={totalEarnings}
        totalDue={totalDue}
        totalExpenses={totalExpenses}
        withButtons={false}
        // onReceivePayment={handleReceivePayment}
        // onMakePayment={handleMakePayment}
      />
      {/*
      <div className="flex w-full flex-col items-start gap-4">
        <span className="text-heading-2 font-heading-2 text-default-font">
          Payment Overview
        </span>
        <div className="flex w-full items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-success-50 px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-success-700">
              TOTAL RECEIVED
            </span>
            <span className="text-heading-2 font-heading-2 text-success-700">
              $45,200
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-warning-50 px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-warning-700">
              PENDING
            </span>
            <span className="text-heading-2 font-heading-2 text-warning-700">
              $12,400
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-error-50 px-6 py-6">
            <span className="text-caption-bold font-caption-bold text-error-700">
              OVERDUE
            </span>
            <span className="text-heading-2 font-heading-2 text-error-700">
              $5,800
            </span>
          </div>
        </div>
      </div>*/}
    </>
  );
}

export default AdminDashboard;
