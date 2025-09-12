import React from 'react';

import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { TextField } from '../../components/TextField';

import { FeatherArrowDown } from '@subframe/core';
import { FeatherArrowUp } from '@subframe/core';
import { FeatherLogs } from '@subframe/core';
import { FeatherSearch } from '@subframe/core';

function AdminBillingPage() {
  return (
    <>
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full flex-wrap items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
            Billing Management
          </span>
          <Button
            variant="neutral-secondary"
            icon={<FeatherLogs />}
            className="w-auto"
          >
            Transaction Log
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-body font-body text-subtext-color">
                Total Earnings
              </span>
              <div className="flex items-end gap-2">
                <span className="text-heading-1 font-heading-1 text-success-600">
                  $124,892
                </span>
                <span className="text-body font-body text-subtext-color pb-1">
                  this month
                </span>
              </div>
            </div>
            <Button
              className="h-10 w-full flex-none"
              icon={<FeatherArrowDown />}
            >
              Receive Payment
            </Button>
          </div>
          <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-body font-body text-subtext-color">
                Due Payments
              </span>
              <div className="flex items-end gap-2">
                <span className="text-heading-1 font-heading-1 text-error-600">
                  $45,231
                </span>
                <span className="text-body font-body text-subtext-color pb-1">
                  outstanding
                </span>
              </div>
            </div>
            <Button
              className="h-10 w-full flex-none"
              variant="destructive-primary"
              icon={<FeatherArrowUp />}
            >
              Make Payment
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
            Doctors Billing
          </span>
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input placeholder="Search doctors..." value="" />
          </TextField>
        </div>
        <Table
          header={
            <Table.HeaderRow>
              <Table.HeaderCell>Doctor</Table.HeaderCell>
              <Table.HeaderCell>Cases</Table.HeaderCell>
              <Table.HeaderCell>Due Amount</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Last Payment</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.HeaderRow>
          }
        >
          <Table.Row>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Avatar
                  size="small"
                  image="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80"
                >
                  A
                </Avatar>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                  Dr. Sarah Wilson
                </span>
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">42</span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body-bold font-body-bold text-error-600">
                $12,450
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="error">Overdue</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">
                Mar 15, 2024
              </span>
            </Table.Cell>
            <Table.Cell>
              <Button size="small">Collect Payment</Button>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Avatar
                  size="small"
                  image="https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80"
                >
                  A
                </Avatar>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                  Dr. James Chen
                </span>
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">38</span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body-bold font-body-bold text-warning-600">
                $8,920
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="warning">Pending</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">
                Apr 1, 2024
              </span>
            </Table.Cell>
            <Table.Cell>
              <Button size="small">Collect Payment</Button>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Avatar
                  size="small"
                  image="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80"
                >
                  A
                </Avatar>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                  Dr. Emily Brooks
                </span>
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">27</span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body-bold font-body-bold text-success-600">
                $5,340
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="success">Current</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">
                Apr 5, 2024
              </span>
            </Table.Cell>
            <Table.Cell>
              <Button size="small">Collect Payment</Button>
            </Table.Cell>
          </Table.Row>
        </Table>
      </div>
    </>
  );
}

export default AdminBillingPage;
