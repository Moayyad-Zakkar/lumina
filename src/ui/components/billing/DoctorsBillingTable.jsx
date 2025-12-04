import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Table } from '../Table';

const DoctorsBillingTable = ({ doctors, onCollectPayment }) => {
  const { t } = useTranslation();

  return (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>{t('billingTable.header.doctor')}</Table.HeaderCell>
          <Table.HeaderCell>{t('billingTable.header.cases')}</Table.HeaderCell>
          <Table.HeaderCell>
            {t('billingTable.header.dueAmount')}
          </Table.HeaderCell>
          <Table.HeaderCell>{t('billingTable.header.status')}</Table.HeaderCell>
          <Table.HeaderCell>
            {t('billingTable.header.lastPayment')}
          </Table.HeaderCell>
          <Table.HeaderCell />
        </Table.HeaderRow>
      }
    >
      {doctors.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={6}>
            <div className="text-center py-8 text-neutral-500">
              {t('billingTable.noDoctorsFound')}
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

const DoctorInfo = ({ doctor }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Avatar size="small" image={doctor.avatar_url}>
        {doctor.full_name?.charAt(0) || 'D'}
      </Avatar>
      <div className="flex flex-col">
        <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
          {doctor.full_name || t('billingTable.unknownDoctor')}
        </span>
        {doctor.clinic && (
          <span className="text-caption font-caption text-subtext-color">
            {doctor.clinic}
          </span>
        )}
      </div>
    </div>
  );
};

const CasesInfo = ({ doctor }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <span className="text-body font-body text-neutral-500">
        {doctor.totalCases} {t('billingTable.totalCases')}
      </span>
      <span className="text-caption font-caption text-error-600">
        {doctor.unpaidCasesCount} {t('billingTable.unpaidCases')}
      </span>
    </div>
  );
};

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

const StatusBadge = ({ paymentStatus }) => {
  const { t } = useTranslation();
  const statusKey = paymentStatus === 'due' ? 'due' : 'current';
  return (
    <Badge variant={paymentStatus === 'due' ? 'error' : 'success'}>
      {t(`billingTable.status.${statusKey}`)}
    </Badge>
  );
};

const LastPaymentDate = ({ date }) => {
  const { t } = useTranslation();
  return (
    <span className="text-body font-body text-neutral-500">
      {date ? new Date(date).toLocaleDateString() : t('billingTable.neverPaid')}
    </span>
  );
};

const CollectPaymentButton = ({ doctor, onCollectPayment }) => {
  const { t } = useTranslation();
  return (
    <Button
      size="small"
      onClick={() => onCollectPayment(doctor)}
      disabled={doctor.totalDueAmount === 0}
    >
      {t('billingTable.collectPaymentButton')}
    </Button>
  );
};

export default DoctorsBillingTable;
