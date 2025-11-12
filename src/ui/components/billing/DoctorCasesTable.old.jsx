import React from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Table } from '../Table';
import { useNavigate } from 'react-router';

const DoctorCasesTable = ({ cases }) => {
  const navigate = useNavigate();
  return (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>Case ID</Table.HeaderCell>
          <Table.HeaderCell>Patient</Table.HeaderCell>
          <Table.HeaderCell>Treatment</Table.HeaderCell>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Total</Table.HeaderCell>
          <Table.HeaderCell>Remaining</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.HeaderRow>
      }
    >
      {cases.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={8}>
            <div className="text-center py-8 text-neutral-500">
              No cases found.
            </div>
          </Table.Cell>
        </Table.Row>
      ) : (
        cases.map((case_item) => (
          <CaseRow
            key={case_item.id}
            case_item={case_item}
            navigate={navigate}
          />
        ))
      )}
    </Table>
  );
};

const CaseRow = ({ case_item, navigate }) => {
  return (
    <Table.Row className="!h-auto">
      <Table.Cell className="!align-top !py-4">
        <CaseIdInfo case_item={case_item} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <PatientInfo case_item={case_item} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <TreatmentDetails case_item={case_item} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <CaseDate date={case_item.case_date} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <CaseAmount amount={case_item.amount} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <CaseRemaining remainingAmount={case_item.remainingAmount} />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <PaymentStatusBadge
          paymentStatus={case_item.paymentStatus}
          paymentPercentage={case_item.paymentPercentage}
        />
      </Table.Cell>
      <Table.Cell className="!align-top !py-4">
        <ViewDetailsButton case_item={case_item} navigate={navigate} />
      </Table.Cell>
    </Table.Row>
  );
};

const CaseIdInfo = ({ case_item }) => (
  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
    {case_item.case_id || `CASE-${case_item.id}`}
  </span>
);

const PatientInfo = ({ case_item }) => (
  <span className="whitespace-nowrap text-body font-body text-neutral-700">
    {case_item.patient_name || 'Unknown Patient'}
  </span>
);

const TreatmentDetails = ({ case_item }) => {
  const hasDetails = case_item.aligners_count || case_item.duration;
  const isUrgent = case_item.urgency === 'Urgent';
  const hasRefinement = case_item.refinement_info;

  return (
    <div className="flex flex-col gap-2 min-w-[180px] max-w-[280px]">
      {/* Treatment Type and Urgent Badge */}
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-body font-body text-neutral-700 leading-tight">
          {case_item.treatment_type || 'Standard Treatment'}
        </span>
        {isUrgent && (
          <Badge variant="error" className="text-xs flex-shrink-0">
            URGENT
          </Badge>
        )}
      </div>

      {/* Details */}
      {hasDetails && (
        <span className="text-caption font-caption text-neutral-500 leading-tight">
          {case_item.aligners_count && `${case_item.aligners_count} aligners`}
          {case_item.aligners_count && case_item.duration && ' • '}
          {case_item.duration}
        </span>
      )}

      {/* Refinement */}
      {hasRefinement && (
        <Badge variant="warning" className="text-xs w-fit">
          {case_item.refinement_info}
        </Badge>
      )}
    </div>
  );
};

const CaseDate = ({ date }) => (
  <span className="whitespace-nowrap text-body font-body text-neutral-500">
    {date ? new Date(date).toLocaleDateString() : 'Not set'}
  </span>
);

const CaseAmount = ({ amount }) => (
  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
    $
    {amount?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || '0.00'}
  </span>
);

const CaseRemaining = ({ remainingAmount }) => {
  const isZero = remainingAmount === 0;
  return (
    <span
      className={`whitespace-nowrap text-body-bold font-body-bold ${
        isZero ? 'text-success-600' : 'text-neutral-700'
      }`}
    >
      $
      {remainingAmount?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || '0.00'}
    </span>
  );
};

const PaymentStatusBadge = ({ paymentStatus, paymentPercentage = 0 }) => {
  const statusConfig = {
    unpaid: {
      variant: 'error',
      text: 'Unpaid',
    },
    partially_paid: {
      variant: 'warning',
      text: `${paymentPercentage.toFixed(0)}% Paid`,
    },
    paid: {
      variant: 'success',
      text: 'Paid',
    },
    not_applicable: {
      variant: 'neutral',
      text: 'No Cost',
    },
    due: {
      variant: 'error',
      text: 'Due',
    },
    overdue: {
      variant: 'error',
      text: 'Overdue',
    },
    pending: {
      variant: 'warning',
      text: 'Pending',
    },
    processing: {
      variant: 'brand',
      text: 'Processing',
    },
  };

  const normalizedStatus = paymentStatus?.toLowerCase() || 'unpaid';
  const config = statusConfig[normalizedStatus] || {
    variant: 'neutral',
    text: 'Unknown',
  };

  return <Badge variant={config.variant}>{config.text}</Badge>;
};

const ViewDetailsButton = ({ case_item, navigate }) => (
  <Button
    size="small"
    variant="neutral-secondary"
    onClick={() => navigate(`/app/cases/${case_item.id}`)}
    className="whitespace-nowrap"
  >
    View Details
  </Button>
);

export default DoctorCasesTable;
