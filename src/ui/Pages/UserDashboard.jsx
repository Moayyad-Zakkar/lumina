import React from 'react';

import { Progress } from '../components/Progress';
import { TextField } from '../components/TextField';
import { Table } from '../components/Table';
import { Avatar } from '../components/Avatar';
import { useLoaderData, useNavigate, useNavigation } from 'react-router';

import { Loader } from '../components/Loader';
import Headline from '../components/Headline';
import { capitalizeFirstSafe } from '../../helper/formatText';
import CaseStatusBadge from '../components/CaseStatusBadge';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';
import DoctorBillingStats from '../components/billing/DoctorBillingStats';

function UserDashboard() {
  /*
  const [casesLoading, setCasesLoading] = useState(true);
  const navigate = useNavigate();
  const [totalCases, setTotalCases] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [casesError, setCasesError] = useState(null);
  */
  const {
    totalCases,
    recentCases,
    casesError,
    submittedCases,
    completedCases,
    profile,
  } = useLoaderData();
  const { totalDue, totalPaid } = useDoctorBillingData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === 'loading';

  return (
    <>
      <Headline>Hello, Dr.{profile.full_name}</Headline>
      <div className="flex w-full flex-wrap items-start gap-4">
        <DoctorBillingStats
          totalDue={totalDue}
          isDashboard={true}
          submittedCases={submittedCases}
          completedCases={completedCases}
          totalCases={totalCases}
        />
        {/* 
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
            COMPLETED WITH 3DA
          </span>
          <span className="text-heading-2 font-heading-2 text-success-700">
            {completedCases}
          </span>
        </div>
        */}
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
              <Table.HeaderCell>Patient Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>

              <Table.HeaderCell>Submission Date</Table.HeaderCell>
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
                  navigate(`/app/cases/${caseItem.id}`);
                }}
              >
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    {/*<Avatar size="small">
                      {capitalizeFirstSafe(caseItem.first_name)?.[0]}
                      {capitalizeFirstSafe(caseItem.last_name)?.[0]}
                    </Avatar>*/}
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {capitalizeFirstSafe(caseItem.first_name)}{' '}
                      {capitalizeFirstSafe(caseItem.last_name)}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <CaseStatusBadge status={caseItem.status} />
                </Table.Cell>
                {/*<Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseItem.aligner_material || '-'}
                  </span>
                </Table.Cell>*/}
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseItem.created_at
                      ? new Date(caseItem.created_at).toLocaleDateString()
                      : '-'}
                  </span>
                </Table.Cell>
                {/*<Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <IconButton icon={<FeatherMoreHorizontal />} />
                  </div>
                </Table.Cell>*/}
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    CASE-{caseItem.id}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table>
      </div>
      {/* 
              <div className="flex w-full flex-col items-start gap-4">
        <span className="text-heading-2 font-heading-2 text-default-font">
          Payment Overview
        </span>

        <DoctorBillingStats
          totalDue={totalDue}
          isDashboard={true}
          submittedCases={submittedCases}
          completedCases={completedCases}
          totalCases={totalCases}
        />
      </div>
        */}
    </>
  );
}

export default UserDashboard;
