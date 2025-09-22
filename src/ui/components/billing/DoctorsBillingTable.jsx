import React from 'react';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Table } from '../Table';

const DoctorsBillingTable = ({ doctors, onCollectPayment }) => {
  return (
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
      {doctors.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={6}>
            <div className="text-center py-8 text-neutral-500">
              No doctors found.
            </div>
          </Table.Cell>
        </Table.Row>
      ) : (
        doctors.map((doctor) => (
          <DoctorRow
            key={doctor.id}
            doctor={doctor}
            onCollectPayment={onCollectPayment}
          />
        ))
      )}
    </Table>
  );
};

const DoctorRow = ({ doctor, onCollectPayment }) => (
  <Table.Row>
    <Table.Cell>
      <DoctorInfo doctor={doctor} />
    </Table.Cell>
    <Table.Cell>
      <CasesInfo doctor={doctor} />
    </Table.Cell>
    <Table.Cell>
      <DueAmount amount={doctor.totalDueAmount} />
    </Table.Cell>
    <Table.Cell>
      <StatusBadge paymentStatus={doctor.paymentStatus} />
    </Table.Cell>
    <Table.Cell>
      <LastPaymentDate date={doctor.lastPaymentDate} />
    </Table.Cell>
    <Table.Cell>
      <CollectPaymentButton
        doctor={doctor}
        onCollectPayment={onCollectPayment}
      />
    </Table.Cell>
  </Table.Row>
);

const DoctorInfo = ({ doctor }) => (
  <div className="flex items-center gap-2">
    <Avatar size="small" image={doctor.avatar_url}>
      {doctor.full_name?.charAt(0) || 'D'}
    </Avatar>
    <div className="flex flex-col">
      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
        {doctor.full_name || 'Unknown Doctor'}
      </span>
      {doctor.clinic && (
        <span className="text-caption font-caption text-subtext-color">
          {doctor.clinic}
        </span>
      )}
    </div>
  </div>
);

const CasesInfo = ({ doctor }) => (
  <div className="flex flex-col">
    <span className="text-body font-body text-neutral-500">
      {doctor.totalCases} total
    </span>
    <span className="text-caption font-caption text-error-600">
      {doctor.unpaidCasesCount} unpaid
    </span>
  </div>
);

const DueAmount = ({ amount }) => (
  <span
    className={`text-body-bold font-body-bold ${
      amount > 0 ? 'text-error-600' : 'text-success-600'
    }`}
  >
    $
    {amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
);

const StatusBadge = ({ paymentStatus }) => (
  <Badge variant={paymentStatus === 'due' ? 'error' : 'success'}>
    {paymentStatus === 'due' ? 'Due' : 'Current'}
  </Badge>
);

const LastPaymentDate = ({ date }) => (
  <span className="text-body font-body text-neutral-500">
    {date ? new Date(date).toLocaleDateString() : 'Never'}
  </span>
);

const CollectPaymentButton = ({ doctor, onCollectPayment }) => (
  <Button
    size="small"
    onClick={() => onCollectPayment(doctor)}
    disabled={doctor.totalDueAmount === 0}
  >
    Collect Payment
  </Button>
);

export default DoctorsBillingTable;
