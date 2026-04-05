import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../Badge';
import { Table } from '../Table';

/* ── Payment status badge — matches PaymentInfo in DoctorCasesTable ────────── */
const PaymentStatusCell = ({ status }) => {
  const { t } = useTranslation();

  const statusConfig = {
    unpaid: {
      variant: 'error',
      text: t('billing.table.paymentStatus.unpaid'),
    },
    paid: {
      variant: 'success',
      text: t('billing.table.paymentStatus.paid'),
    },
    pending: {
      variant: 'warning',
      text: t('billing.table.paymentStatus.pending'),
    },
  };

  const config = statusConfig[status ?? 'unpaid'] ?? statusConfig.unpaid;

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.text}
    </Badge>
  );
};

/* ── Service type badge ─────────────────────────────────────────────────────── */
const ServiceBadge = () => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-700">
      {t('additionalServices.badge')}
    </span>
  );
};

/* ── Main table ─────────────────────────────────────────────────────────────── */
const AdditionalServicesTable = ({ services = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-x-auto">
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>
              {t('additionalServices.table.columnService')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {t('additionalServices.table.columnNotes')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {t('additionalServices.table.columnDate')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {t('additionalServices.table.columnPrice')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {t('additionalServices.table.columnStatus')}
            </Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {services.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <div className="text-center py-8 text-neutral-500">
                {t('additionalServices.table.noServices')}
              </div>
            </Table.Cell>
          </Table.Row>
        ) : (
          services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))
        )}
      </Table>
    </div>
  );
};

const ServiceRow = ({ service }) => (
  <Table.Row>
    <Table.Cell>
      <ServiceNameCell service={service} />
    </Table.Cell>
    <Table.Cell>
      <NotesCell notes={service.notes} />
    </Table.Cell>
    <Table.Cell>
      <DateCell date={service.created_at} />
    </Table.Cell>
    <Table.Cell>
      <PriceCell price={service.price} />
    </Table.Cell>
    <Table.Cell>
      <PaymentStatusCell status={service.payment_status} />
    </Table.Cell>
  </Table.Row>
);

const ServiceNameCell = ({ service }) => (
  <div className="flex flex-col gap-0.5">
    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
      {service.service_name}
    </span>
  </div>
);

const NotesCell = ({ notes }) => (
  <span className="text-body font-body text-neutral-500 line-clamp-2">
    {notes || '—'}
  </span>
);

const DateCell = ({ date }) => (
  <span className="whitespace-nowrap text-body font-body text-neutral-500">
    {date ? new Date(date).toLocaleDateString() : '—'}
  </span>
);

const PriceCell = ({ price }) => (
  <span className="text-body-bold font-body-bold text-neutral-700 whitespace-nowrap">
    $
    {parseFloat(price ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
);

export default AdditionalServicesTable;
