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
          <Table.HeaderCell>Amount</Table.HeaderCell>
          <Table.HeaderCell>Payment Status</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.HeaderRow>
      }
    >
      {cases.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={7}>
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

const CaseRow = ({ case_item, navigate }) => (
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
      <PaymentStatusBadge paymentStatus={case_item.payment_status} />
    </Table.Cell>
    <Table.Cell>
      <ViewDetailsButton case_item={case_item} navigate={navigate} />
    </Table.Cell>
  </Table.Row>
);

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

const PaymentStatusBadge = ({ paymentStatus }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'due':
      case 'overdue':
        return 'error';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Paid';
      case 'due':
        return 'Due';
      case 'overdue':
        return 'Overdue';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      default:
        return 'Unknown';
    }
  };

  return (
    <Badge variant={getStatusVariant(paymentStatus)}>
      {getStatusLabel(paymentStatus)}
    </Badge>
  );
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
