import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import {
  FeatherArrowLeft,
  FeatherDownload,
  FeatherSearch,
  FeatherFilter,
  FeatherX,
} from '@subframe/core';
import AdminHeadline from '../../components/AdminHeadline';
import supabase from '../../../helper/supabaseClient';
import { Link } from 'react-router';
import { Breadcrumbs } from '../../components/Breadcrumbs';

function AdminTransactionLogPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all payments with doctor and admin info
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          type,
          notes,
          created_at,
          doctor_id,
          admin_id
        `
        )
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch doctor and admin details separately
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

      if (paymentsError) throw paymentsError;

      if (adminsError) throw adminsError;

      // Create lookup maps
      const doctorsMap = (doctorsData || []).reduce((acc, doc) => {
        acc[doc.id] = doc;
        return acc;
      }, {});

      const adminsMap = (adminsData || []).reduce((acc, admin) => {
        acc[admin.id] = admin;
        return acc;
      }, {});

      // Transform data to match transaction format
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
    }
  };

  // Filtered transactions
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

  // Calculate statistics
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

  const getTypeColor = (type) => {
    const colors = {
      payment_received: 'bg-brand-100 text-brand-700',
      expense: 'bg-error-100 text-error-700',
    };
    return colors[type] || 'bg-neutral-100 text-neutral-700';
  };

  const getTypeLabel = (type) => {
    const labels = {
      payment_received: 'Payment',
      expense: 'Expense',
    };
    return labels[type] || type;
  };

  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Type',
      'From',
      'Email',
      'Clinic',
      'Description',
      'Amount',
      'Processed By',
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

    // Properly escape CSV cells
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

    // Build filename with filter context
    let filename = 'transaction-log';
    if (typeFilter !== 'all') {
      filename += `-${typeFilter}`;
    }
    if (dateFilter !== 'all') {
      filename += `-${dateFilter}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;

    // Add UTF-8 BOM to support Arabic and other Unicode characters
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

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      {/* Header */}
      <PageHeader onExport={exportToCSV} />

      {/* Statistics Cards */}
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Transactions" value={stats.total.toString()} />
        <StatCard
          label="Total Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          valueClass="text-success-600"
        />
        <StatCard
          label="Total Expenses"
          value={`$${stats.expenses.toFixed(2)}`}
          valueClass="text-error-600"
        />
        <StatCard
          label="Net Income"
          value={`$${stats.netIncome.toFixed(2)}`}
          valueClass={
            stats.netIncome >= 0 ? 'text-success-600' : 'text-error-600'
          }
        />
      </div>

      {/* Filters Section */}
      <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-neutral-border bg-default-background p-4">
        <div className="flex w-full items-center gap-4">
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
            className="grow shrink-0 basis-0"
          >
            <TextField.Input
              placeholder="Search by name, email, clinic, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </TextField>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="neutral-tertiary"
                size="medium"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            )}
            <Button
              variant="neutral-secondary"
              size="medium"
              icon={<FeatherFilter />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid w-full grid-cols-1 gap-4 border-t border-neutral-border pt-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-body-bold font-body-bold text-default-font">
                Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              >
                <option value="all">All Types</option>
                <option value="payment_received">Payments Received</option>
                <option value="expense">Expenses</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body-bold font-body-bold text-default-font">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-md border border-neutral-border bg-default-background px-3 py-2 text-body font-body text-default-font outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="w-full overflow-hidden rounded-lg border border-neutral-border bg-default-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-border bg-subtle-background">
              <tr>
                <th className="px-6 py-3 text-left text-label-bold font-label-bold text-subtext-color">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-label-bold font-label-bold text-subtext-color">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-label-bold font-label-bold text-subtext-color">
                  From
                </th>
                <th className="px-6 py-3 text-left text-label-bold font-label-bold text-subtext-color">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-label-bold font-label-bold text-subtext-color">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-label-bold font-label-bold text-subtext-color">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-body font-body text-subtext-color"
                  >
                    No transactions found matching your filters
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.fullId}
                    className="hover:bg-subtle-background transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body-bold font-body-bold text-default-font">
                        {txn.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body font-body text-default-font">
                        {txn.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-body-bold font-body-bold text-default-font">
                        {txn.from}
                      </div>
                      {txn.email !== '-' && (
                        <div className="text-caption font-caption text-subtext-color">
                          {txn.email}
                        </div>
                      )}
                      {txn.clinic !== '-' && (
                        <div className="text-caption font-caption text-subtext-color">
                          {txn.clinic}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-body font-body text-default-font">
                        {txn.description}
                      </div>
                      <div className="text-caption font-caption text-subtext-color">
                        Processed by {txn.processedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-label font-label ${getTypeColor(
                          txn.type
                        )}`}
                      >
                        {getTypeLabel(txn.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-body-bold font-body-bold ${
                          txn.type === 'expense'
                            ? 'text-error-600'
                            : 'text-success-600'
                        }`}
                      >
                        {txn.type === 'expense' && '-'}${txn.amount.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredTransactions.length > 0 && (
        <div className="w-full text-center text-body font-body text-subtext-color">
          Showing {filteredTransactions.length} of {transactions.length}{' '}
          transactions
        </div>
      )}
    </div>
  );
}

const PageHeader = ({ onExport }) => (
  <div className="flex w-full items-start gap-2 flex-row justify-between">
    <Breadcrumbs>
      <Link to="/admin/billing">
        <Breadcrumbs.Item>Billing</Breadcrumbs.Item>
      </Link>
      <Breadcrumbs.Divider />
      <Breadcrumbs.Item active={true}>Transactions Log</Breadcrumbs.Item>
    </Breadcrumbs>
    <Button
      variant="brand-primary"
      size="medium"
      icon={<FeatherDownload />}
      onClick={onExport}
      className="w-auto"
    >
      Export CSV
    </Button>
  </div>
);

const StatCard = ({ label, value, valueClass = 'text-default-font' }) => (
  <div className="flex flex-col gap-2 rounded-lg border border-neutral-border bg-default-background p-4">
    <div className="text-caption font-caption text-subtext-color">{label}</div>
    <div className={`text-heading-2 font-heading-2 ${valueClass}`}>{value}</div>
  </div>
);

export default AdminTransactionLogPage;
