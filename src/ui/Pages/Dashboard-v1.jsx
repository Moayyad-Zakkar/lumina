import React from 'react';
import { Button } from '../components/Button';
import { FeatherPlus } from '@subframe/core';
import { Progress } from '../components/Progress';
import { TextField } from '../components/TextField';
import { Table } from '../components/Table';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { IconButton } from '../components/IconButton';
import { FeatherMoreHorizontal } from '@subframe/core';
import { useNavigate } from 'react-router';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { useEffect, useState } from 'react';
import supabase from '../../helper/supabaseClient';
import { Loader } from '../components/Loader';
import Headline from '../components/Headline';

function Dashboard() {
  const navigate = useNavigate();
  const [totalCases, setTotalCases] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState(null);

  useEffect(() => {
    const checkAuthAndFetchCases = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCasesLoading(true);
      const [countRes, recentRes] = await Promise.all([
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('cases')
          .select(
            'id, first_name, last_name, status, aligner_material, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const { count, error: countError } = countRes;
      if (!countError) setTotalCases(count);
      else setTotalCases('—');

      const { data: casesData, error: casesErr } = recentRes;
      if (!casesErr) {
        setRecentCases(casesData);
        setCasesError(null);
      } else {
        setRecentCases([]);
        setCasesError(casesErr.message);
      }
      setCasesLoading(false);
    };
    checkAuthAndFetchCases();
  }, [navigate]);

  return (
    <>
      <Headline>Dashboard</Headline>
      <div className="flex w-full flex-wrap items-start gap-4">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            TOTAL CASES
          </span>
          <span className="text-heading-2 font-heading-2 text-default-font">
            {totalCases === null ? <Loader size="small" /> : totalCases}
          </span>
          <Progress value={75} />
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            PENDING REVIEW
          </span>
          <span className="text-heading-2 font-heading-2 text-warning-700">
            8
          </span>
          <Progress value={25} />
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color">
            COMPLETED THIS MONTH
          </span>
          <span className="text-heading-2 font-heading-2 text-success-700">
            45
          </span>
          <Progress value={45} />
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
              <Table.HeaderCell>Case ID</Table.HeaderCell>
              <Table.HeaderCell>Patient Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Material</Table.HeaderCell>
              <Table.HeaderCell>Submission Date</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.HeaderRow>
          }
        >
          {casesLoading ? (
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
              <Table.Row key={caseItem.id}>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    CASE-{caseItem.id}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar size="small">
                      {capitalizeFirstSafe(caseItem.first_name)?.[0]}
                      {capitalizeFirstSafe(caseItem.last_name)?.[0]}
                    </Avatar>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {capitalizeFirstSafe(caseItem.first_name)}{' '}
                      {capitalizeFirstSafe(caseItem.last_name)}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={
                      caseItem.status === 'completed'
                        ? 'success'
                        : caseItem.status === 'pending'
                        ? 'warning'
                        : caseItem.status === 'in_progress'
                        ? undefined
                        : 'error'
                    }
                  >
                    {caseItem.status === 'in_progress'
                      ? 'In Progress'
                      : caseItem.status === 'pending'
                      ? 'In Review'
                      : caseItem.status === 'completed'
                      ? 'Completed'
                      : caseItem.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseItem.aligner_material || '-'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseItem.created_at
                      ? new Date(caseItem.created_at).toLocaleDateString()
                      : '-'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <IconButton icon={<FeatherMoreHorizontal />} />
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table>
      </div>
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
      </div>
    </>
  );
}

export default Dashboard;
