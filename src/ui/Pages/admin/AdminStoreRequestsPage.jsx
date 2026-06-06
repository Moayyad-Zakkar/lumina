import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FeatherCheckCircle,
  FeatherClock,
  FeatherRefreshCw,
  FeatherXCircle,
} from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import AdminHeadline from '../../components/AdminHeadline';
import { Loader } from '../../components/Loader';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import Error from '../../components/Error';
import toast from 'react-hot-toast';

const AdminStoreRequestsPage = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: rows, error: fetchError } = await supabase
        .from('store_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const doctorIds = [
        ...new Set((rows || []).map((r) => r.doctor_id).filter(Boolean)),
      ];

      let profilesMap = {};
      if (doctorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, clinic')
          .in('id', doctorIds);

        profilesMap = Object.fromEntries(
          (profiles || []).map((p) => [p.id, p]),
        );
      }

      setRequests(
        (rows || []).map((r) => ({
          ...r,
          doctor: profilesMap[r.doctor_id] || null,
        })),
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const buildServiceName = (request) => {
    if (request.quantity > 1) {
      return `${request.product_name} (×${request.quantity})`;
    }
    return request.product_name;
  };

  const buildServiceNotes = (request) => {
    const parts = [];
    if (request.product_description) {
      parts.push(request.product_description);
    }
    if (request.notes) {
      parts.push(request.notes);
    }
    return parts.join('\n\n');
  };

  const handleApprove = async (request) => {
    if (request.status !== 'pending') return;
    if (!confirm(t('store.admin.confirmApprove'))) return;

    setProcessingId(request.id);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: service, error: insertError } = await supabase
        .from('additional_services')
        .insert({
          doctor_id: request.doctor_id,
          service_name: buildServiceName(request),
          notes: buildServiceNotes(request),
          price: parseFloat(request.total_price),
          store_request_id: request.id,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('store_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
          additional_service_id: service.id,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast.success(t('store.admin.approveSuccess'));
      localStorage.setItem(
        'store_request_count',
        String(
          Math.max(
            0,
            parseInt(localStorage.getItem('store_request_count') || '1', 10) -
              1,
          ),
        ),
      );
      fetchRequests(true);
    } catch (err) {
      console.error(err);
      toast.error(t('store.admin.approveFailed'));
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!confirm(t('store.admin.confirmReject'))) return;

    setProcessingId(requestId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('store_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(t('store.admin.rejectSuccess'));
      localStorage.setItem(
        'store_request_count',
        String(
          Math.max(
            0,
            parseInt(localStorage.getItem('store_request_count') || '1', 10) -
              1,
          ),
        ),
      );
      fetchRequests(true);
    } catch (err) {
      console.error(err);
      toast.error(t('store.admin.rejectFailed'));
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: FeatherClock,
        label: t('store.requestStatus.pending'),
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: FeatherCheckCircle,
        label: t('store.requestStatus.approved'),
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: FeatherXCircle,
        label: t('store.requestStatus.rejected'),
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const doctorLabel = (request) => {
    const p = request.doctor;
    if (!p) return '—';
    return p.clinic ? `${p.full_name} (${p.clinic})` : p.full_name;
  };

  return (
    <>
      {error && <Error error={error} />}

      <AdminHeadline submit={false}>
        {t('store.admin.requestsTitle')}
      </AdminHeadline>

      <div className="flex w-full justify-between items-center gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('store.admin.requestsSubtitle')}
        </p>
        <IconButton
          icon={
            <FeatherRefreshCw className={refreshing ? 'animate-spin' : ''} />
          }
          onClick={() => fetchRequests(true)}
          disabled={refreshing}
        />
      </div>

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>{t('store.admin.colDoctor')}</Table.HeaderCell>
            <Table.HeaderCell>{t('store.admin.colProduct')}</Table.HeaderCell>
            <Table.HeaderCell>{t('store.table.quantity')}</Table.HeaderCell>
            <Table.HeaderCell>{t('store.table.total')}</Table.HeaderCell>
            <Table.HeaderCell>{t('store.table.status')}</Table.HeaderCell>
            <Table.HeaderCell>{t('store.table.date')}</Table.HeaderCell>
            <Table.HeaderCell>{t('common.actions')}</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="flex w-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : requests.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="text-center py-8 text-neutral-500">
                {t('store.admin.noRequests')}
              </div>
            </Table.Cell>
          </Table.Row>
        ) : (
          requests.map((request) => (
            <Table.Row key={request.id}>
              <Table.Cell>
                <span className="text-body-bold font-body-bold text-neutral-700">
                  {doctorLabel(request)}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-body font-body">
                    {request.product_name}
                  </span>
                  {request.notes && (
                    <span className="text-caption text-subtext-color line-clamp-2">
                      {request.notes}
                    </span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>{request.quantity}</Table.Cell>
              <Table.Cell>
                ${parseFloat(request.total_price).toFixed(2)}
                <span className="block text-caption text-subtext-color">
                  ${parseFloat(request.unit_price).toFixed(2)} /{' '}
                  {t('store.unit')}
                </span>
              </Table.Cell>
              <Table.Cell>{getStatusBadge(request.status)}</Table.Cell>
              <Table.Cell>
                {new Date(request.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                {request.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      onClick={() => handleApprove(request)}
                      loading={processingId === request.id}
                      disabled={!!processingId}
                    >
                      {t('common.approve')}
                    </Button>
                    <Button
                      size="small"
                      variant="neutral-secondary"
                      onClick={() => handleReject(request.id)}
                      loading={processingId === request.id}
                      disabled={!!processingId}
                    >
                      {t('common.reject')}
                    </Button>
                  </div>
                ) : (
                  <span className="text-caption text-subtext-color">—</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>
    </>
  );
};

export default AdminStoreRequestsPage;
