import { useState, useEffect } from 'react';
import supabase, { supabaseAdmin } from '../../../helper/supabaseClient';
import {
  FeatherCheckCircle,
  FeatherClock,
  FeatherEye,
  FeatherXCircle,
  FeatherRefreshCw,
} from '@subframe/core';
import AdminHeadline from '../../components/AdminHeadline';
import AdminCreateUserDialog from '../../components/AdminCreateUserDialog';
import { Loader } from '../../components/Loader';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import Error from '../../components/Error';

const AdminSignUpRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('signup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRequests(true);
  };

  const handleApprove = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setProcessingId(selectedRequest.id);
    setError(null);

    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: selectedRequest.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: selectedRequest.full_name,
            clinic: selectedRequest.clinic,
            phone: selectedRequest.phone,
            address: selectedRequest.address,
          },
        });

      if (authError) throw authError;

      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          user_id: authData.user.id,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile check warning:', profileError);
      }

      alert(
        `User account created successfully!\nEmail: ${selectedRequest.email}\nPassword: ${password}`
      );

      setShowApprovalModal(false);
      setPassword('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!confirm('Are you sure you want to reject this request?')) return;

    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('signup_requests')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateUser = async (formData) => {
    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            full_name: formData.full_name,
            clinic: formData.clinic,
            phone: formData.phone,
            address: formData.address,
          },
        });

      if (authError) throw authError;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile verification warning:', profileError);
      } else {
        console.log('Profile created successfully:', profile);
      }

      console.log('User created successfully:', authData.user);
      alert(
        `User account created successfully!\nEmail: ${formData.email}\nPassword: ${formData.password}`
      );
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user account');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: FeatherClock,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: FeatherCheckCircle,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: FeatherXCircle,
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      {error && <Error error={error} />}

      <AdminHeadline
        submit={false}
        createUser={true}
        onCreateUser={() => setShowCreateDialog(true)}
      >
        Sign Up Requests
      </AdminHeadline>

      <div className="flex w-full justify-between items-center gap-4">
        <p className="text-body font-body text-subtext-color">
          Review and approve new user registrations
        </p>

        <div className="flex items-center gap-2 flex-shrink-0">
          <IconButton
            icon={
              <FeatherRefreshCw className={refreshing ? 'animate-spin' : ''} />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          />
        </div>
      </div>

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Clinic</Table.HeaderCell>
            <Table.HeaderCell>Phone</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : requests.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="text-center py-8">
                <span className="text-neutral-500">
                  No sign-up requests found
                </span>
              </div>
            </Table.Cell>
          </Table.Row>
        ) : (
          requests.map((request) => (
            <Table.Row key={request.id}>
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  {request.full_name}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-700">
                  {request.email}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {request.clinic}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {request.phone || '-'}
                </span>
              </Table.Cell>
              <Table.Cell>{getStatusBadge(request.status)}</Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowApprovalModal(true);
                    }}
                    className="text-sky-600 hover:text-sky-900"
                    title="View Details"
                  >
                    <FeatherEye className="w-5 h-5" />
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApprovalModal(true);
                        }}
                        disabled={processingId === request.id}
                        className="text-success-600 hover:text-success-900 disabled:opacity-50"
                      >
                        <FeatherCheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="text-error-600 hover:text-error-900 disabled:opacity-50"
                      >
                        <FeatherXCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Review Sign-Up Request
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.full_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Clinic Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.clinic}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRequest.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Clinic Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.address}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Set Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Enter password for user"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 characters. Make sure to save this password.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <Button
                variant="neutral-secondary"
                onClick={() => {
                  setShowApprovalModal(false);
                  setPassword('');
                  setSelectedRequest(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              {selectedRequest.status === 'pending' && (
                <Button
                  variant="brand-primary"
                  onClick={handleApprove}
                  disabled={processingId === selectedRequest.id}
                >
                  {processingId === selectedRequest.id
                    ? 'Creating Account...'
                    : 'Approve & Create Account'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <AdminCreateUserDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateUser}
      />
    </>
  );
};

export default AdminSignUpRequests;
