import { useState, useEffect } from 'react';
import supabase, { supabaseAdmin } from '../../../helper/supabaseClient';
import {
  FeatherCheckCircle,
  FeatherClock,
  FeatherEye,
  FeatherXCircle,
} from '@subframe/core';
import AdminHeadline from '../../components/AdminHeadline';

const AdminSignUpRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [password, setPassword] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('signup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setProcessingId(selectedRequest.id);
    setError(null);

    try {
      // Create the user in Supabase Auth
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

      // Update the request status to approved
      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          user_id: authData.user.id,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Note: Profile is automatically created via database trigger
      // The trigger creates the profile with role='user' by default
      // If you need to verify the profile was created, you can check:
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile check warning:', profileError);
        // Profile might be created by trigger slightly delayed
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl">
        <div className="w-auto mb-6">
          <AdminHeadline submit={false}>Sign-Up Requests</AdminHeadline>
          <p className="mt-2 text-gray-600">
            Review and approve new user registrations
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No sign-up requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.clinic}
                      </div>
                      {request.phone_number && (
                        <div className="text-sm text-gray-500">
                          {request.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setPassword('');
                  setSelectedRequest(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              {selectedRequest.status === 'pending' && (
                <button
                  onClick={handleApprove}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 font-medium disabled:bg-success-400"
                >
                  {processingId === selectedRequest.id
                    ? 'Creating Account...'
                    : 'Approve & Create Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSignUpRequests;
