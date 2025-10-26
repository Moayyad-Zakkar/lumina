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
          <Table.HeaderCell>Treatment Type</Table.HeaderCell>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Total Amount</Table.HeaderCell>
          <Table.HeaderCell>Remaining Amount</Table.HeaderCell>
          <Table.HeaderCell>Payment Status</Table.HeaderCell>
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
  console.log(case_item);
  return (
    <Table.Row>
      <Table.Cell>
        <CaseIdInfo case_item={case_item} />
      </Table.Cell>
      <Table.Cell>
        <PatientInfo case_item={case_item} />
      </Table.Cell>
      <Table.Cell>
        <TreatmentDetails case_item={case_item} />
      </Table.Cell>
      <Table.Cell>
        <CaseDate date={case_item.case_date} />
      </Table.Cell>
      <Table.Cell>
        <CaseAmount amount={case_item.amount} />
      </Table.Cell>
      <Table.Cell>
        <CaseRemaining remainingAmount={case_item.remainingAmount} />
      </Table.Cell>
      <Table.Cell>
        <PaymentStatusBadge
          paymentStatus={case_item.paymentStatus}
          paymentPercentage={case_item.paymentPercentage}
        />
      </Table.Cell>
      <Table.Cell>
        <ViewDetailsButton case_item={case_item} navigate={navigate} />
      </Table.Cell>
    </Table.Row>
  );
};

const CaseIdInfo = ({ case_item }) => (
  <div className="flex flex-col">
    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
      {case_item.case_id || `CASE-${case_item.id}`}
    </span>
    {case_item.case_number && (
      <span className="text-caption font-caption text-subtext-color">
        #{case_item.case_number}
      </span>
    )}
  </div>
);

const PatientInfo = ({ case_item }) => (
  <div className="flex flex-col">
    <span className="whitespace-nowrap text-body font-body text-default-font">
      {case_item.patient_name || 'Unknown Patient'}
    </span>
    {case_item.patient_id && (
      <span className="text-caption font-caption text-subtext-color">
        ID: {case_item.patient_id}
      </span>
    )}
  </div>
);

const TreatmentDetails = ({ case_item }) => (
  <div className="flex flex-col">
    <span className="text-body font-body text-default-font">
      {case_item.treatment_type || 'Standard Treatment'}
    </span>
    <div className="flex gap-2 text-caption font-caption text-subtext-color">
      {case_item.aligners_count && <span>{case_item.aligners_count}</span>}
      {case_item.duration && <span>• {case_item.duration}</span>}
      {case_item.urgency === 'Urgent' && (
        <span className="text-error-600">• URGENT</span>
      )}
    </div>
    {case_item.refinement_info && (
      <span className="text-caption font-caption text-warning-600">
        {case_item.refinement_info}
      </span>
    )}
  </div>
);

const CaseDate = ({ date }) => (
  <div className="flex flex-col">
    <span className="text-body font-body text-default-font">
      {date ? new Date(date).toLocaleDateString() : 'Not set'}
    </span>
    <span className="text-caption font-caption text-subtext-color">
      {date
        ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        : ''}
    </span>
  </div>
);

const CaseAmount = ({ amount }) => (
  <span className="text-body-bold font-body-bold text-default-font">
    $
    {amount?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
);

const CaseRemaining = ({ remainingAmount }) => (
  <span className="text-body-bold font-body-bold text-default-font">
    $
    {remainingAmount?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
);

const PaymentStatusBadge = ({ paymentStatus, paymentPercentage = 0 }) => {
  const statusConfig = {
    unpaid: {
      color: 'error',
      text: 'Unpaid',
    },
    partially_paid: {
      color: 'warning',
      text: `${paymentPercentage.toFixed(0)}% Paid`,
    },
    paid: {
      color: 'success',
      text: 'Paid',
    },
    not_applicable: {
      color: 'neutral',
      text: 'No Cost',
    },
    // Legacy statuses for backwards compatibility
    due: {
      color: 'error',
      text: 'Due',
    },
    overdue: {
      color: 'error',
      text: 'Overdue',
    },
    pending: {
      color: 'warning',
      text: 'Pending',
    },
    processing: {
      color: 'brand',
      text: 'Processing',
    },
  };

  const normalizedStatus = paymentStatus?.toLowerCase() || 'unpaid';
  const config = statusConfig[normalizedStatus] || {
    color: 'neutral',
    text: 'Unknown',
  };

  return <Badge variant={config.color}>{config.text}</Badge>;
};

const ViewDetailsButton = ({ case_item, navigate }) => (
  <Button
    size="small"
    variant="neutral-secondary"
    onClick={() => navigate(`/app/cases/${case_item.id}`)}
  >
    View Details
  </Button>
);

export default DoctorCasesTable;
