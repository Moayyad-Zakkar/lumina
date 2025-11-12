import React from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Table } from '../Table';
import { useNavigate } from 'react-router';

const DoctorCasesTable = ({ cases }) => {
  const navigate = useNavigate();
  return (
    <div className="w-full overflow-x-auto">
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>Case</Table.HeaderCell>
            <Table.HeaderCell>Patient</Table.HeaderCell>
            <Table.HeaderCell>Treatment Details</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Payment</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.HeaderRow>
        }
      >
        {cases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={6}>
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
    </div>
  );
};

const CaseRow = ({ case_item, navigate }) => {
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
        <PaymentInfo case_item={case_item} />
      </Table.Cell>
      <Table.Cell>
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
  const isUrgent = case_item.urgency === 'Urgent';
  const hasRefinement = case_item.refinement_info;
  
  // Build compact info line
  const infoParts = [];
  if (case_item.aligners_count) infoParts.push(`${case_item.aligners_count} aligners`);
  if (case_item.duration) infoParts.push(case_item.duration);
  const infoText = infoParts.join(' • ');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-body text-neutral-700">
          {case_item.treatment_type || 'Standard Treatment'}
        </span>
        {infoText && (
          <span className="text-caption font-caption text-neutral-500">
            {infoText}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {isUrgent && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-error-100 text-error-700">
            URGENT
          </span>
        )}
        {hasRefinement && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 text-warning-700">
            {case_item.refinement_info}
          </span>
        )}
      </div>
    </div>
  );
};

const CaseDate = ({ date }) => (
  <span className="whitespace-nowrap text-body font-body text-neutral-500">
    {date ? new Date(date).toLocaleDateString() : 'Not set'}
  </span>
);

const PaymentInfo = ({ case_item }) => {
  const { amount, remainingAmount, paymentStatus, paymentPercentage = 0 } = case_item;
  
  const statusConfig = {
    unpaid: { variant: 'error', text: 'Unpaid' },
    partially_paid: { variant: 'warning', text: `${paymentPercentage.toFixed(0)}%` },
    paid: { variant: 'success', text: 'Paid' },
    not_applicable: { variant: 'neutral', text: 'N/A' },
    due: { variant: 'error', text: 'Due' },
    overdue: { variant: 'error', text: 'Overdue' },
    pending: { variant: 'warning', text: 'Pending' },
    processing: { variant: 'brand', text: 'Processing' },
  };

  const normalizedStatus = paymentStatus?.toLowerCase() || 'unpaid';
  const config = statusConfig[normalizedStatus] || { variant: 'neutral', text: 'Unknown' };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-body-bold font-body-bold text-neutral-700">
          ${amount?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || '0.00'}
        </span>
        <Badge variant={config.variant} className="text-xs">
          {config.text}
        </Badge>
      </div>
      {remainingAmount > 0 && (
        <span className="text-caption font-caption text-neutral-500">
          ${remainingAmount?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} remaining
        </span>
      )}
    </div>
  );
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
