import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
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
  FeatherX,
  FeatherRefreshCw,
  FeatherTrash,
  FeatherCalendar,
  FeatherPrinter,
} from '@subframe/core';
import AdminHeadline from '../../components/AdminHeadline';
import supabase from '../../../helper/supabaseClient';
import { useUserRole } from '../../../helper/useUserRole';
import { Link } from 'react-router';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { isSuperAdmin } from '../../../helper/auth';
import DialogWrapper from '../../components/DialogWrapper';

/* -------------------------------------------------------
   PrintableInvoice Component
------------------------------------------------------- */
const PrintableInvoice = React.forwardRef(({ transaction, casesData }, ref) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const statusDisplayText = {
    submitted: t('caseStatusBadge.submitted'),
    accepted: t('caseStatusBadge.accepted'),
    under_review: t('caseStatusBadge.underReview'),
    rejected: t('caseStatusBadge.rejected'),
    awaiting_patient_approval: t('caseStatusBadge.awaitingApproval'),
    patient_rejected: t('caseStatusBadge.patientRejected'),
    awaiting_user_approval: t('caseStatusBadge.awaitingApproval'),
    user_rejected: t('caseStatusBadge.userRejected'),
    approved: t('caseStatusBadge.approved'),
    in_production: t('caseStatusBadge.inProduction'),
    ready_for_delivery: t('caseStatusBadge.readyForDelivery'),
    delivered: t('caseStatusBadge.delivered'),
    completed: t('caseStatusBadge.completed'),
  };

  const invoiceNumber = transaction.id;
  const currentDate = new Date(transaction.datetime).toLocaleDateString();

  return (
    <div ref={ref} className="p-8 bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b-2 border-brand-600 pb-4 mb-6`}
      >
        <div>
          <img
            className="h-10 flex-none object-cover"
            src={`${window.location.origin}/logo.png`}
            alt="Logo"
          />
          <p className="text-sm text-gray-600 mt-2">
            {t('paymentCollectionDialog.paymentReceipt')}
          </p>
        </div>
        <div className={isRTL ? 'text-left' : 'text-right'}>
          <p className="text-sm text-gray-600">
            <strong>{t('paymentCollectionDialog.invoice')} #:</strong>{' '}
            {invoiceNumber}
          </p>
          <p className="text-sm text-gray-600">
            <strong>{t('transactions.table.date')}:</strong> {currentDate}
          </p>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t('paymentCollectionDialog.doctorLabel')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                {t('paymentCollectionDialog.name')}
              </p>
              <p className="text-sm text-gray-900">{transaction.from}</p>
            </div>
            {transaction.email !== '-' && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t('auth.email')}
                </p>
                <p className="text-sm text-gray-900">{transaction.email}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {transaction.clinic !== '-' && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t('casePage.clinic')}
                </p>
                <p className="text-sm text-gray-900">{transaction.clinic}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t('paymentCollectionDialog.paymentSummary')}
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className={`flex justify-between items-center mb-2`}>
            <span className="text-sm font-medium text-gray-700">
              {t('paymentCollectionDialog.paymentAmount')}
            </span>
            <span className="text-lg font-bold text-gray-900">
              ${transaction.amount.toFixed(2)}
            </span>
          </div>
          {transaction.description && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {t('paymentCollectionDialog.notes')}
              </p>
              <p className="text-sm text-gray-700">{transaction.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cases Breakdown */}
      {casesData && casesData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('paymentCollectionDialog.casesIncluded')}
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('cases.caseId')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('paymentCollectionDialog.patient')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('paymentCollectionDialog.statusLabel')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('casePage.treatmentPlan.totalCost')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('paymentCollectionDialog.paymentAmountLabel')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {casesData.map((case_) => (
                  <tr key={case_.id}>
                    <td
                      className={`px-4 py-3 text-sm text-gray-900 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {t('doctorTransactions.case')} #{case_.id}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-gray-900 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {case_.first_name} {case_.last_name}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-gray-700 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {statusDisplayText[case_.status] || case_.status}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-gray-900 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      ${parseFloat(case_.total_cost || 0).toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-gray-900 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      ${case_.paymentApplied.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="4"
                    className={`px-4 py-3 text-sm font-medium text-gray-900 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t('paymentCollectionDialog.totalPayment')}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-bold text-gray-900 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    ${transaction.amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>
          {t('adminTreatmentPlan.print.footer', {
            date: new Date().toLocaleString(),
          })}
        </p>
      </div>
    </div>
  );
});

function AdminTransactionLogPage() {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const isSuperAdminUser = isSuperAdmin(role);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [transactionToPrint, setTransactionToPrint] = useState(null);
  const [fetchedCasesData, setFetchedCasesData] = useState([]);
  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useRef();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${transactionToPrint?.id || 'Receipt'}`,
  });

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach((txn) => {
      const year = new Date(txn.datetime).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

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

  /* ------------------------------------------------------------------
     Handle Print Click - Fetch Cases from payment_case_allocations
  ------------------------------------------------------------------ */
  const handlePrintClick = async (transaction) => {
    setTransactionToPrint(transaction);
    setShowPrintPreview(true);
    setPrintLoading(true);
    setFetchedCasesData([]); // Reset previous data

    try {
      // Query the junction table 'payment_case_allocations'
      // And join with 'cases' table to get details
      const { data, error } = await supabase
        .from('payment_case_allocations')
        .select(
          `
          allocated_amount,
          cases (
            id,
            first_name,
            last_name,
            status,
            total_cost
          )
        `
        )
        .eq('payment_id', transaction.fullId);

      if (error) {
        console.error('Error fetching invoice details:', error);
      } else if (data) {
        // Transform the data: flatten the object and rename allocated_amount to paymentApplied
        const formattedCases = data.map((item) => ({
          ...item.cases,
          paymentApplied: parseFloat(item.allocated_amount),
        }));
        setFetchedCasesData(formattedCases);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintAndClose = () => {
    handlePrint();
    setTimeout(() => {
      setShowPrintPreview(false);
      setTransactionToPrint(null);
      setFetchedCasesData([]);
    }, 500);
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setTransactionToPrint(null);
    setFetchedCasesData([]);
  };

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    try {
      setDeletingId(transactionToDelete.fullId);
      setError(null);

      // Deleting the payment should cascade delete allocations if FKs are set up correctly.
      // If strict FKs prevent this, you might need to delete from payment_case_allocations first.
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', transactionToDelete.fullId);

      if (deleteError) throw deleteError;

      setTransactions((prev) =>
        prev.filter((txn) => txn.fullId !== transactionToDelete.fullId)
      );

      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setTransactionToDelete(null);
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

      const txnDate = new Date(txn.datetime);
      const today = new Date();

      let matchesQuickDate = true;
      if (dateFilter !== 'all') {
        if (dateFilter === 'today') {
          matchesQuickDate = txnDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesQuickDate = txnDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesQuickDate = txnDate >= monthAgo;
        }
      }

      let matchesYear = true;
      if (selectedYear !== 'all') {
        matchesYear = txnDate.getFullYear() === parseInt(selectedYear);
      }

      let matchesDateRange = true;
      if (startDate || endDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && txnDate >= start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && txnDate <= end;
        }
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesQuickDate &&
        matchesYear &&
        matchesDateRange
      );
    });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    dateFilter,
    selectedYear,
    startDate,
    endDate,
  ]);

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
    if (selectedYear !== 'all') {
      filename += `-${selectedYear}`;
    }
    if (startDate || endDate) {
      filename += `-custom-range`;
    } else if (dateFilter !== 'all') {
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
    setSelectedYear('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchTerm ||
    typeFilter !== 'all' ||
    dateFilter !== 'all' ||
    selectedYear !== 'all' ||
    startDate ||
    endDate;

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
          <div className="flex flex-col gap-3">
            <div className="flex w-full items-center gap-2 justify-stretch flex-wrap">
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
                <option value="all">
                  {t('transactions.filters.allTypes')}
                </option>
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
                <option value="week">
                  {t('transactions.filters.lastWeek')}
                </option>
                <option value="month">
                  {t('transactions.filters.lastMonth')}
                </option>
              </select>

              <Button
                size="sm"
                variant={
                  showAdvancedFilters ? 'neutral-secondary' : 'neutral-tertiary'
                }
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                icon={<FeatherCalendar />}
              >
                Advanced Filters
              </Button>

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

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="rounded-md border border-neutral-border bg-neutral-50 p-4">
                <h3 className="text-body-bold font-body-bold text-default-font mb-3">
                  Advanced Date Filters
                </h3>
                <div className="flex flex-wrap gap-4">
                  {/* Year Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption-bold font-caption-bold text-subtext-color">
                      Filter by Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600 min-w-[140px]"
                    >
                      <option value="all">All Years</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption-bold font-caption-bold text-subtext-color">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption-bold font-caption-bold text-subtext-color">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600"
                    />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <p className="text-caption font-caption text-subtext-color mt-2">
                    {startDate && endDate
                      ? `Showing transactions from ${new Date(
                          startDate
                        ).toLocaleDateString('en-GB')} to ${new Date(
                          endDate
                        ).toLocaleDateString('en-GB')}`
                      : startDate
                      ? `Showing transactions from ${new Date(
                          startDate
                        ).toLocaleDateString('en-GB')} onwards`
                      : `Showing transactions up to ${new Date(
                          endDate
                        ).toLocaleDateString('en-GB')}`}
                  </p>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-neutral-600">
                  Active filters:
                </span>
                {typeFilter !== 'all' && (
                  <Badge variant="neutral" className="text-xs">
                    Type:{' '}
                    {typeFilter === 'payment_received'
                      ? 'Payments'
                      : 'Expenses'}
                    <button
                      onClick={() => setTypeFilter('all')}
                      className="ml-1 hover:text-neutral-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="neutral" className="text-xs">
                    Period: {dateFilter}
                    <button
                      onClick={() => setDateFilter('all')}
                      className="ml-1 hover:text-neutral-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedYear !== 'all' && (
                  <Badge variant="neutral" className="text-xs">
                    Year: {selectedYear}
                    <button
                      onClick={() => setSelectedYear('all')}
                      className="ml-1 hover:text-neutral-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {(startDate || endDate) && (
                  <Badge variant="neutral" className="text-xs">
                    Custom Range: {startDate || '...'} to {endDate || '...'}
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="ml-1 hover:text-neutral-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="neutral" className="text-xs">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:text-neutral-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
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
                <Table.HeaderCell>{t('common.actions')}</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {filteredTransactions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
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
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <IconButton
                        icon={<FeatherPrinter />}
                        onClick={() => handlePrintClick(txn)}
                        variant="neutral"
                      />
                      {isSuperAdminUser && (
                        <IconButton
                          icon={<FeatherTrash />}
                          onClick={() => handleDeleteClick(txn)}
                          disabled={deletingId === txn.fullId}
                          variant="destructive"
                        />
                      )}
                    </div>
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

      {/* Print Preview Dialog */}
      {showPrintPreview && transactionToPrint && (
        <DialogWrapper
          isOpen={showPrintPreview}
          onClose={handleClosePrintPreview}
          title={t('paymentCollectionDialog.paymentInvoice')}
          description={t('paymentCollectionDialog.paymentInvoiceDescription')}
          icon={<FeatherPrinter />}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4 w-full pt-4">
            {printLoading ? (
              <div className="flex w-full h-40 justify-center items-center">
                <Loader size="medium" />
              </div>
            ) : (
              <div className="border border-neutral-border rounded-lg bg-white max-h-[60vh] overflow-y-auto">
                <PrintableInvoice
                  ref={printRef}
                  transaction={transactionToPrint}
                  casesData={fetchedCasesData}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-border w-full mt-6">
            <Button
              variant="neutral-secondary"
              onClick={handleClosePrintPreview}
            >
              {t('common.close')}
            </Button>
            <Button
              icon={<FeatherPrinter />}
              onClick={handlePrintAndClose}
              disabled={printLoading}
            >
              {t('paymentCollectionDialog.printInvoice')}
            </Button>
          </div>
        </DialogWrapper>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-heading-3 font-heading-3 text-default-font mb-2">
              Delete Transaction
            </h3>
            <p className="text-body font-body text-subtext-color mb-4">
              Are you sure you want to delete this transaction?
            </p>
            <div className="bg-neutral-50 rounded-md p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-caption-bold font-caption-bold text-neutral-700">
                  Transaction ID:
                </span>
                <span className="text-body font-body text-neutral-900">
                  {transactionToDelete.id}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-caption-bold font-caption-bold text-neutral-700">
                  Type:
                </span>
                <Badge
                  variant={
                    transactionToDelete.type === 'expense' ? 'error' : 'brand'
                  }
                >
                  {getTypeLabel(transactionToDelete.type)}
                </Badge>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-caption-bold font-caption-bold text-neutral-700">
                  Amount:
                </span>
                <span
                  className={`text-body-bold font-body-bold ${
                    transactionToDelete.type === 'expense'
                      ? 'text-error-600'
                      : 'text-success-600'
                  }`}
                >
                  {transactionToDelete.type === 'expense' && '-'}$
                  {transactionToDelete.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-caption-bold font-caption-bold text-neutral-700">
                  From:
                </span>
                <span className="text-body font-body text-neutral-900">
                  {transactionToDelete.from}
                </span>
              </div>
            </div>
            <div className="bg-error-50 border border-error-200 rounded-md p-3 mb-6">
              <p className="text-caption font-caption text-error-700">
                ⚠️ This action cannot be undone. The transaction will be
                permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="neutral-secondary"
                onClick={handleDeleteCancel}
                disabled={deletingId === transactionToDelete.fullId}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive-primary"
                onClick={handleDeleteConfirm}
                disabled={deletingId === transactionToDelete.fullId}
                className="flex-1"
              >
                {deletingId === transactionToDelete.fullId
                  ? 'Deleting...'
                  : 'Delete Transaction'}
              </Button>
            </div>
          </div>
        </div>
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
