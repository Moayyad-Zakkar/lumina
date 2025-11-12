import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { IconButton } from '../../components/IconButton';
import {
  FeatherDownload,
  FeatherSearch,
  FeatherFilter,
  FeatherX,
  FeatherRefreshCw,
} from '@subframe/core';
import AdminHeadline from '../../components/AdminHeadline';
import supabase from '../../../helper/supabaseClient';
import { Link } from 'react-router';
import { Breadcrumbs } from '../../components/Breadcrumbs';

function AdminTransactionLogPage() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, type, notes, created_at, doctor_id, admin_id')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const doctorIds = [
        ...new Set(paymentsData.map((p) => p.doctor_id).filter(Boolean)),
      ];
      const adminIds = [
        ...new Set(paymentsData.map((p) => p.admin_id).filter(Boolean)),
      ];

      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, clinic')
        .in('id', doctorIds);

      if (doctorsError) throw doctorsError;

      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', adminIds);

      if (adminsError) throw adminsError;

      const doctorsMap = (doctorsData || []).reduce((acc, doc) => {
        acc[doc.id] = doc;
        return acc;
      }, {});

      const adminsMap = (adminsData || []).reduce((acc, admin) => {
        acc[admin.id] = admin;
        return acc;
      }, {});

      const formattedTransactions = (paymentsData || []).map((payment) => {
        const doctor = payment.doctor_id ? doctorsMap[payment.doctor_id] : null;
        const admin = payment.admin_id ? adminsMap[payment.admin_id] : null;

        return {
          id: `TXN-${payment.id.toString().slice(0, 8)}`,
          fullId: payment.id,
          date: new Date(payment.created_at).toLocaleDateString('en-GB'),
          datetime: payment.created_at,
          type: payment.type === 'payment' ? 'payment_received' : 'expense',
          description:
            payment.notes ||
            (payment.type === 'payment'
              ? `Payment from ${doctor?.full_name || 'Unknown'}`
              : 'Expense'),
          from:
            payment.type === 'payment'
              ? doctor?.full_name || 'Unknown Doctor'
              : payment.notes || 'Expense',
          email: doctor?.email || '-',
          clinic: doctor?.clinic || '-',
          amount: parseFloat(payment.amount || 0),
          status: 'completed',
          processedBy: admin?.full_name || 'System',
        };
      });
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.clinic.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || txn.type === typeFilter;

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

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, dateFilter]);

  const stats = useMemo(() => {
    const paymentsReceived = filteredTransactions.filter(
      (t) => t.type === 'payment_received'
    );
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');

    const totalRevenue = paymentsReceived.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    return {
      total: filteredTransactions.length,
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }, [filteredTransactions]);

  const getTypeLabel = (type) => {
    return type === 'payment_received'
      ? t('transactions.paymentReceived')
      : t('transactions.expense');
  };

  const exportToCSV = () => {
    const headers = [
      t('transactions.table.transactionId'),
      t('transactions.table.date'),
      t('transactions.table.type'),
      t('transactions.table.from'),
      t('transactions.table.email'),
      t('transactions.table.clinic'),
      t('transactions.table.description'),
      t('transactions.table.amount'),
      t('transactions.table.processedBy'),
    ];

    const csvData = filteredTransactions.map((txn) => [
      txn.id,
      txn.date,
      getTypeLabel(txn.type),
      txn.from,
      txn.email,
      txn.clinic,
      txn.description,
      txn.amount.toFixed(2),
      txn.processedBy,
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

    let filename = 'transaction-log';
    if (typeFilter !== 'all') {
      filename += `-${typeFilter}`;
    }
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
    setTypeFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters =
    searchTerm || typeFilter !== 'all' || dateFilter !== 'all';

  return (
    <>
      {error && <Error error={error} />}

      <Breadcrumbs>
        <Link to="/admin/billing">
          <Breadcrumbs.Item>{t('navigation.billing')}</Breadcrumbs.Item>
        </Link>
        <Breadcrumbs.Divider />
        <Breadcrumbs.Item active={true}>
          {t('transactions.title')}
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <AdminHeadline submit={false}>{t('transactions.title')}</AdminHeadline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('transactions.subtitle')}
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
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label={t('transactions.stats.totalTransactions')}
              value={stats.total.toString()}
            />
            <StatCard
              label={t('transactions.stats.totalRevenue')}
              value={`$${stats.revenue.toFixed(2)}`}
              valueClass="text-success-600"
            />
            <StatCard
              label={t('transactions.stats.totalExpenses')}
              value={`$${stats.expenses.toFixed(2)}`}
              valueClass="text-error-600"
            />
            <StatCard
              label={t('transactions.stats.netIncome')}
              value={`$${stats.netIncome.toFixed(2)}`}
              valueClass={
                stats.netIncome >= 0 ? 'text-success-600' : 'text-error-600'
              }
            />
          </div>

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
                  placeholder={t('transactions.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </TextField>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600"
            >
              <option value="all">{t('transactions.filters.allTypes')}</option>
              <option value="payment_received">
                {t('transactions.filters.paymentsReceived')}
              </option>
              <option value="expense">
                {t('transactions.filters.expenses')}
              </option>
            </select>

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
                  {t('transactions.table.from')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.description')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.type')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.amount')}
                </Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {filteredTransactions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <div className="text-center py-8">
                    <span className="text-neutral-500">
                      {t('transactions.noTransactions')}
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-body-bold font-body-bold text-neutral-700">
                        {txn.from}
                      </span>
                      {txn.email !== '-' && (
                        <span className="text-caption font-caption text-neutral-500">
                          {txn.email}
                        </span>
                      )}
                      {txn.clinic !== '-' && (
                        <span className="text-caption font-caption text-neutral-500">
                          {txn.clinic}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-body font-body text-neutral-700">
                        {txn.description}
                      </span>
                      <span className="text-caption font-caption text-neutral-500">
                        {t('transactions.processedBy')} {txn.processedBy}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={txn.type === 'expense' ? 'error' : 'brand'}>
                      {getTypeLabel(txn.type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span
                      className={`whitespace-nowrap text-body-bold font-body-bold ${
                        txn.type === 'expense'
                          ? 'text-error-600'
                          : 'text-success-600'
                      }`}
                    >
                      {txn.type === 'expense' && '-'}${txn.amount.toFixed(2)}
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
              {t('transactions.transactions')}
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

export default AdminTransactionLogPage;
