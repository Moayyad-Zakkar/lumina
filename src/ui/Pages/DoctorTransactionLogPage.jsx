import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import { Table } from '../components/Table';
import { IconButton } from '../components/IconButton';
import Headline from '../components/Headline';
import {
  FeatherDownload,
  FeatherSearch,
  FeatherX,
  FeatherRefreshCw,
} from '@subframe/core';
import { Link } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs';
import supabase from '../../helper/supabaseClient';
//import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';

function DoctorTransactionLogPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  //const { totalDue } = useDoctorBillingData();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchDoctorTransactions();
  }, []);

  const fetchDoctorTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, type, notes, created_at, admin_id')
        .eq('doctor_id', user.id)
        .eq('type', 'payment')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const adminIds = [
        ...new Set(paymentsData.map((p) => p.admin_id).filter(Boolean)),
      ];

      let adminsData = [];
      if (adminIds.length > 0) {
        const { data, error: adminsError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', adminIds);

        if (adminsError) throw adminsError;
        adminsData = data || [];
      }

      const adminsMap = adminsData.reduce((acc, admin) => {
        acc[admin.id] = admin;
        return acc;
      }, {});

      const paymentIds = paymentsData.map((p) => p.id);
      let allocationsData = [];
      let casesData = [];

      if (paymentIds.length > 0) {
        const { data: allocs, error: allocsError } = await supabase
          .from('payment_case_allocations')
          .select('payment_id, case_id, allocated_amount')
          .in('payment_id', paymentIds);

        if (allocsError) throw allocsError;
        allocationsData = allocs || [];

        const caseIds = [...new Set(allocationsData.map((a) => a.case_id))];
        if (caseIds.length > 0) {
          const { data: cases, error: casesError } = await supabase
            .from('cases')
            .select('id, first_name, last_name')
            .in('id', caseIds);

          if (casesError) throw casesError;
          casesData = cases || [];
        }
      }

      const casesMap = casesData.reduce((acc, case_) => {
        acc[case_.id] = case_;
        return acc;
      }, {});

      const allocationsByPayment = allocationsData.reduce((acc, alloc) => {
        if (!acc[alloc.payment_id]) {
          acc[alloc.payment_id] = [];
        }
        acc[alloc.payment_id].push(alloc);
        return acc;
      }, {});

      const formattedTransactions = (paymentsData || []).map((payment) => {
        const admin = payment.admin_id ? adminsMap[payment.admin_id] : null;
        const allocations = allocationsByPayment[payment.id] || [];

        const caseNames = allocations
          .map((alloc) => {
            const case_ = casesMap[alloc.case_id];
            if (case_) {
              return `${case_.first_name || ''} ${
                case_.last_name || ''
              }`.trim();
            }
            return null;
          })
          .filter(Boolean);

        const description = payment.notes
          ? payment.notes
          : caseNames.length > 0
          ? `Payment for: ${caseNames.join(', ')}`
          : 'Payment';

        return {
          id: `TXN-${payment.id.toString().slice(0, 8)}`,
          fullId: payment.id,
          date: new Date(payment.created_at).toLocaleDateString('en-GB'),
          datetime: payment.created_at,
          description: description,
          casesCount: allocations.length,
          caseNames: caseNames,
          amount: parseFloat(payment.amount || 0),
          receivedBy: admin?.full_name || 'System',
          notes: payment.notes || '-',
        };
      });

      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error fetching doctor transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDoctorTransactions(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.caseNames.some((name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const txnDate = new Date(txn.datetime);
        const today = new Date();

        if (dateFilter === 'today') {
          matchesDate = txnDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = txnDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = txnDate >= monthAgo;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [transactions, searchTerm, dateFilter]);
  /*
  const stats = useMemo(() => {
    const totalPaid = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalPayments = filteredTransactions.length;

    return {
      total: totalPayments,
      totalPaid: totalPaid,
    };
  }, [filteredTransactions]);
  */

  const exportToCSV = () => {
    const headers = [
      t('transactions.table.transactionId'),
      t('transactions.table.date'),
      t('transactions.table.description'),
      t('doctorTransactions.cases'),
      t('transactions.table.amount'),
      t('doctorTransactions.receivedBy'),
      t('doctorTransactions.notes'),
    ];

    const csvData = filteredTransactions.map((txn) => [
      txn.id,
      txn.date,
      txn.description,
      txn.caseNames.join('; '),
      txn.amount.toFixed(2),
      txn.receivedBy,
      txn.notes,
    ]);

    const escapeCSVCell = (cell) => {
      const cellStr = String(cell);
      if (
        cellStr.includes(',') ||
        cellStr.includes('"') ||
        cellStr.includes('\n')
      ) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    };

    const csv = [
      headers.map(escapeCSVCell).join(','),
      ...csvData.map((row) => row.map(escapeCSVCell).join(',')),
    ].join('\n');

    let filename = 'my-payments';
    if (dateFilter !== 'all') {
      filename += `-${dateFilter}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm || dateFilter !== 'all';

  return (
    <>
      {error && <Error error={error} />}

      <Breadcrumbs>
        <Link to="/app/billing">
          <Breadcrumbs.Item>{t('billing.myBilling')}</Breadcrumbs.Item>
        </Link>
        <Breadcrumbs.Divider />
        <Breadcrumbs.Item active={true}>
          {t('doctorTransactions.title')}
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <Headline submit={false}>{t('doctorTransactions.title')}</Headline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('doctorTransactions.subtitle')}
        </p>
        <div className="flex items-center gap-2">
          <IconButton
            icon={
              <FeatherRefreshCw className={refreshing ? 'animate-spin' : ''} />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          />
          <Button
            variant="brand-primary"
            size="medium"
            icon={<FeatherDownload />}
            onClick={exportToCSV}
            className="w-auto"
          >
            {t('transactions.exportCSV')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex w-full h-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          {/*
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label={t('doctorTransactions.stats.totalPayments')}
              value={stats.total.toString()}
            />
            <StatCard
              label={t('doctorTransactions.stats.totalPaid')}
              value={`$${stats.totalPaid.toFixed(2)}`}
              valueClass="text-brand-600"
            />
            <StatCard
              label={t('doctorTransactions.stats.amountDue')}
              value={`$${totalDue.toFixed(2)}`}
              valueClass="text-error-600"
            />
          </div>
           */}

          {/* Filters */}
          <div className="flex w-full items-center gap-2">
            <div className="flex-grow max-w-[400px]">
              <TextField
                variant="filled"
                label=""
                helpText=""
                icon={<FeatherSearch />}
              >
                <TextField.Input
                  placeholder={t('doctorTransactions.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </TextField>
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600"
            >
              <option value="all">{t('transactions.filters.allTime')}</option>
              <option value="today">{t('transactions.filters.today')}</option>
              <option value="week">{t('transactions.filters.lastWeek')}</option>
              <option value="month">
                {t('transactions.filters.lastMonth')}
              </option>
            </select>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="neutral-tertiary"
                className="px-2 w-auto"
                onClick={clearFilters}
                icon={<FeatherX />}
              >
                {t('common.clear')}
              </Button>
            )}
          </div>

          {/* Table */}
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>
                  {t('transactions.table.id')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.date')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('doctorTransactions.cases')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.amount')}
                </Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {filteredTransactions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <div className="text-center py-8">
                    <span className="text-neutral-500">
                      {t('doctorTransactions.noPayments')}
                    </span>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredTransactions.map((txn) => (
                <Table.Row key={txn.fullId}>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                      {txn.id}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {txn.date}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {txn.casesCount > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-body font-body text-neutral-700">
                          {txn.casesCount}{' '}
                          {txn.casesCount === 1
                            ? t('doctorTransactions.case')
                            : t('doctorTransactions.cases')}
                        </span>
                        {txn.caseNames.length > 0 && (
                          <span className="text-caption font-caption text-neutral-500 line-clamp-2">
                            {txn.caseNames.join(', ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-body font-body text-neutral-500">
                        {t('doctorTransactions.generalPayment')}
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-brand-600">
                      ${txn.amount.toFixed(2)}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table>

          {/* Results Summary */}
          {filteredTransactions.length > 0 && (
            <div className="w-full text-body font-body text-subtext-color">
              {t('transactions.showing')} {filteredTransactions.length}{' '}
              {t('transactions.of')} {transactions.length}{' '}
              {t('doctorTransactions.payments')}
            </div>
          )}
        </>
      )}
    </>
  );
}

const StatCard = ({ label, value, valueClass = 'text-default-font' }) => (
  <div className="flex flex-col gap-2 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
    <span className="text-caption-bold font-caption-bold text-subtext-color">
      {label}
    </span>
    <span className={`text-heading-2 font-heading-2 ${valueClass}`}>
      {value}
    </span>
  </div>
);

export default DoctorTransactionLogPage;
