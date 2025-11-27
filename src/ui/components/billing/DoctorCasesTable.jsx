import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Table } from '../Table';
import { useNavigate } from 'react-router';

const DoctorCasesTable = ({ cases }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto">
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>{t('billing.table.case')}</Table.HeaderCell>
            <Table.HeaderCell>{t('billing.table.patient')}</Table.HeaderCell>
            <Table.HeaderCell>
              {t('billing.table.treatmentDetails')}
            </Table.HeaderCell>
            <Table.HeaderCell>{t('billing.table.date')}</Table.HeaderCell>
            <Table.HeaderCell>{t('billing.table.payment')}</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.HeaderRow>
        }
      >
        {cases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={6}>
              <div className="text-center py-8 text-neutral-500">
                {t('billing.table.noCases')}
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

const PatientInfo = ({ case_item }) => {
  const { t } = useTranslation();
  return (
    <span className="whitespace-nowrap text-body font-body text-neutral-700">
      {case_item.patient_name || t('billing.table.unknownPatient')}
    </span>
  );
};

const TreatmentDetails = ({ case_item }) => {
  const { t } = useTranslation();
  const isUrgent = case_item.urgency === 'Urgent';
  const hasRefinement = case_item.refinement_info;

  // Build compact info line
  const infoParts = [];
  if (case_item.aligners_count)
    infoParts.push(
      t('billing.table.alignersCount', { count: case_item.aligners_count })
    );
  if (case_item.duration) infoParts.push(case_item.duration);
  const infoText = infoParts.join(' • ');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-body text-neutral-700">
          {case_item.treatment_type || t('billing.table.standardTreatment')}
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
            {t('billing.table.urgent')}
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

const CaseDate = ({ date }) => {
  const { t } = useTranslation();
  return (
    <span className="whitespace-nowrap text-body font-body text-neutral-500">
      {date ? new Date(date).toLocaleDateString() : t('billing.table.notSet')}
    </span>
  );
};

const PaymentInfo = ({ case_item }) => {
  const { t } = useTranslation();
  const {
    amount,
    remainingAmount,
    paymentStatus,
    paymentPercentage = 0,
  } = case_item;

  const statusConfig = {
    unpaid: { variant: 'error', text: t('billing.table.paymentStatus.unpaid') },
    partially_paid: {
      variant: 'warning',
      text: `${paymentPercentage.toFixed(0)}%`,
    },
    paid: { variant: 'success', text: t('billing.table.paymentStatus.paid') },
    not_applicable: {
      variant: 'neutral',
      text: t('billing.table.paymentStatus.na'),
    },
    due: { variant: 'error', text: t('billing.table.paymentStatus.due') },
    overdue: {
      variant: 'error',
      text: t('billing.table.paymentStatus.overdue'),
    },
    pending: {
      variant: 'warning',
      text: t('billing.table.paymentStatus.pending'),
    },
    processing: {
      variant: 'brand',
      text: t('billing.table.paymentStatus.processing'),
    },
  };

  const normalizedStatus = paymentStatus?.toLowerCase() || 'unpaid';
  const config = statusConfig[normalizedStatus] || {
    variant: 'neutral',
    text: t('billing.table.paymentStatus.unknown'),
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-body-bold font-body-bold text-neutral-700">
          $
          {amount?.toLocaleString('en-US', {
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
          $
          {remainingAmount?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          {t('billing.table.remaining')}
        </span>
      )}
    </div>
  );
};

const ViewDetailsButton = ({ case_item, navigate }) => {
  const { t } = useTranslation();
  return (
    <Button
      size="small"
      variant="neutral-secondary"
      onClick={() => navigate(`/app/cases/${case_item.id}`)}
      className="whitespace-nowrap"
    >
      {t('common.viewDetails')}
    </Button>
  );
};

export default DoctorCasesTable;
