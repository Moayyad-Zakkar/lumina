import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import { FeatherDownload, FeatherSearch, FeatherFilter } from '@subframe/core';
import { Link } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs';
import supabase from '../../helper/supabaseClient';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';

function DoctorTransactionLogPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { totalDue } = useDoctorBillingData();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDoctorTransactions();
  }, []);

  const fetchDoctorTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user (doctor)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Fetch payments made by this doctor
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          type,
          notes,
          created_at,
          admin_id
        `
        )
        .eq('doctor_id', user.id)
        .eq('type', 'payment')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch admin details
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

      // Create admin lookup map
      const adminsMap = adminsData.reduce((acc, admin) => {
        acc[admin.id] = admin;
        return acc;
      }, {});

      // Fetch payment allocations to get case details
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

        // Get case details for allocated payments
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

      // Create cases lookup map
      const casesMap = casesData.reduce((acc, case_) => {
        acc[case_.id] = case_;
        return acc;
      }, {});

      // Create allocations by payment map
      const allocationsByPayment = allocationsData.reduce((acc, alloc) => {
        if (!acc[alloc.payment_id]) {
          acc[alloc.payment_id] = [];
        }
        acc[alloc.payment_id].push(alloc);
        return acc;
      }, {});

      // Transform data to match transaction format
      const formattedTransactions = (paymentsData || []).map((payment) => {
        const admin = payment.admin_id ? adminsMap[payment.admin_id] : null;
        const allocations = allocationsByPayment[payment.id] || [];

        // Get case names for this payment
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
    }
  };

  // Filtered transactions
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

  // Calculate statistics
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

  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Description',
      'Cases',
      'Amount',
      'Received By',
      'Notes',
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
    let filename = 'my-payments';
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
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm || dateFilter !== 'all';

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <PageHeader onExport={exportToCSV} />

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Payments" value={stats.total.toString()} />
        <StatCard
          label="Total Paid"
          value={`$${stats.totalPaid.toFixed(2)}`}
          valueClass="text-brand-600"
        />
        <StatCard
          label="Amount Due"
          value={`$${totalDue.toFixed(2)}`}
          valueClass="text-error-600"
        />
      </div>

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
              placeholder="Search by description, case name, or transaction ID..."
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
          <div className="grid w-full grid-cols-1 gap-4 border-t border-neutral-border pt-4">
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

      <div className="w-full overflow-hidden rounded-lg border border-neutral-border bg-default-background">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="border-b border-neutral-border bg-subtle-background">
              <tr>
                <th className="w-[20%] px-6 py-3 text-left text-label font-label text-subtext-color uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="w-[20%] px-6 py-3 text-left text-label font-label text-subtext-color uppercase tracking-wider">
                  Date
                </th>
                <th className="w-[40%] px-6 py-3 text-left text-label font-label text-subtext-color uppercase tracking-wider">
                  Cases
                </th>
                <th className="w-[15%] px-6 py-3 text-right text-label font-label text-subtext-color uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border bg-default-background">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-body font-body text-subtext-color"
                  >
                    No payment transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.fullId}
                    className="hover:bg-subtle-background transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-body font-body text-default-font truncate">
                        {txn.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-body font-body text-default-font">
                        {txn.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {txn.casesCount > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="text-body font-body text-default-font">
                            {txn.casesCount}{' '}
                            {txn.casesCount === 1 ? 'case' : 'cases'}
                          </div>
                          {txn.caseNames.length > 0 && (
                            <div className="text-caption font-caption text-subtext-color line-clamp-2">
                              {txn.caseNames.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-body font-body text-subtext-color">
                          General payment
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-body font-body text-brand-600">
                        ${txn.amount.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length > 0 && (
        <div className="w-full text-center text-body font-body text-subtext-color">
          Showing {filteredTransactions.length} of {transactions.length}{' '}
          payments
        </div>
      )}
    </div>
  );
}

const PageHeader = ({ onExport }) => (
  <div className="flex w-full items-start gap-2 flex-row justify-between">
    <Breadcrumbs>
      <Link to="/app/billing">
        <Breadcrumbs.Item>My Billing</Breadcrumbs.Item>
      </Link>
      <Breadcrumbs.Divider />
      <Breadcrumbs.Item active={true}>Payment History</Breadcrumbs.Item>
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

export default DoctorTransactionLogPage;
