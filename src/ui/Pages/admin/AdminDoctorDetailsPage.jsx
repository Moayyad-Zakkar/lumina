import React, { useMemo, useState } from 'react';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { useLoaderData, useNavigate } from 'react-router';
import AdminHeadline from '../../components/AdminHeadline';
import Error from '../../components/Error';
import { Table } from '../../components/Table';
import { Avatar } from '../../components/Avatar';
import { IconWithBackground } from '../../components/IconWithBackground';
import { TextField } from '../../components/TextField';
import { Badge } from '../../components/Badge';
import CaseStatusBadge from '../../components/CaseStatusBadge';

export default function AdminDoctorDetailsPage() {
  const { doctor, cases, error } = useLoaderData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const doctorInitial = useMemo(() => {
    const name = doctor?.full_name || '';
    return name.trim().charAt(0).toUpperCase() || 'D';
  }, [doctor]);

  const uniquePatientsCount = useMemo(() => {
    if (!Array.isArray(cases)) return 0;
    const normalizedNames = cases.map((c) =>
      `${(c.first_name || '').toLowerCase()} ${(
        c.last_name || ''
      ).toLowerCase()}`.trim()
    );
    return new Set(normalizedNames).size;
  }, [cases]);

  const activeStatuses = useMemo(
    () =>
      new Set([
        'submitted',
        'under_review',
        'awaiting_patient_approval',
        'awaiting_user_approval',
        'approved',
        'in_production',
        'ready_for_delivery',
      ]),
    []
  );

  const activeCasesCount = useMemo(() => {
    if (!Array.isArray(cases)) return 0;
    return cases.filter((c) => activeStatuses.has(c.status)).length;
  }, [cases, activeStatuses]);

  const filteredCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      `${(c.first_name || '').toLowerCase()} ${(
        c.last_name || ''
      ).toLowerCase()}`.includes(q)
    );
  }, [cases, searchQuery]);

  if (error) {
    return <Error error={error} />;
  }

  return (
    <>
      <AdminHeadline>Doctor Details</AdminHeadline>
      {/* Header section with avatar and doctor details */}
      <div className="flex w-full flex-col items-start gap-8 px-12 pt-12 pb-6">
        <div className="flex w-full flex-wrap items-start gap-4">
          <Avatar size="x-large" image={doctor?.avatar_url || undefined}>
            {!doctor?.avatar_url ? doctorInitial : null}
          </Avatar>
          <div className="flex min-w-[160px] grow shrink-0 basis-0 flex-col items-start gap-6 pt-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-heading-2 font-heading-2 text-default-font">
                {capitalizeFirstSafe(doctor?.full_name) || '—'}
              </span>
            </div>
            <div className="flex w-full flex-wrap items-start gap-6">
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Phone Number
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.phone || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Email
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.email || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Clinic Name
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.clinic || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Clinic Address
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.address || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Recent Cases */}
      <div className="flex w-full grow flex-col items-start gap-8 bg-default-background px-12 py-6 overflow-auto">
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground />
              <span className="text-heading-3 font-heading-3 text-default-font">
                Total Patients
              </span>
            </div>
            <span className="text-heading-1 font-heading-1 text-default-font">
              {uniquePatientsCount.toLocaleString()}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground variant="success" />
              <span className="text-heading-3 font-heading-3 text-default-font">
                Active Cases
              </span>
            </div>
            <span className="text-heading-1 font-heading-1 text-default-font">
              {activeCasesCount.toLocaleString()}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground variant="warning" />
              <span className="text-heading-3 font-heading-3 text-default-font">
                Due Payments
              </span>
            </div>
            <span className="text-heading-1 font-heading-1 text-default-font">
              $—
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-heading-2 font-heading-2 text-default-font">
              Recent Cases
            </span>
            <TextField variant="filled" label="" helpText="">
              <TextField.Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </TextField>
          </div>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Patient Name</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {!filteredCases || filteredCases.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500 py-4">
                    No cases found.
                  </span>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredCases.map((c) => (
                <Table.Row
                  key={c.id}
                  clickable
                  onClick={() => navigate(`/admin/cases/${c.id}`)}
                >
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                      {capitalizeFirstSafe(c.first_name)}{' '}
                      {capitalizeFirstSafe(c.last_name)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <CaseStatusBadge status={c.status} />
                  </Table.Cell>
                  <Table.Cell>
                    {/* Placeholder until payment status is available */}
                    <Badge variant="warning">Pending</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {/* Placeholder until amount is available */}
                      $—
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table>
        </div>
      </div>
    </>
  );
}
