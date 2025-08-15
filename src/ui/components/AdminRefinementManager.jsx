import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { FeatherCheck, FeatherX } from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';

const AdminRefinementManager = ({ caseId }) => {
  const [refinementRequests, setRefinementRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefinementRequests();
  }, [caseId]);

  const fetchRefinementRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('refinement_requests')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefinementRequests(data || []);
    } catch (error) {
      console.error('Error fetching refinement requests:', error);
      toast.error('Failed to load refinement requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    try {
      setLoading(true);

      const { error: updateError } = await supabase
        .from('refinement_requests')
        .update({
          status: status,
          admin_response: `Request ${status}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast.success(`Refinement request ${status} successfully`);
      fetchRefinementRequests();
    } catch (error) {
      console.error('Error responding to refinement request:', error);
      toast.error('Failed to respond to refinement request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="neutral">Pending</Badge>;
      case 'approved':
        return <Badge variant="brand">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading && refinementRequests.length === 0) {
    return (
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <span className="text-heading-3 font-heading-3 text-default-font">
          Refinement Requests
        </span>
        <div className="text-body font-body text-subtext-color">
          Loading refinement requests...
        </div>
      </div>
    );
  }

  if (refinementRequests.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        Refinement Requests
      </span>

      <div className="flex w-full flex-col gap-3">
        {refinementRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-start justify-between gap-4 rounded-md border border-solid border-neutral-border p-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  Refinement Request #{request.id.slice(0, 8)}
                </span>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-body font-body text-subtext-color">
                {request.reason || 'No reason provided'}
              </p>
              <div className="text-sm text-subtext-color">
                {new Date(request.created_at).toLocaleDateString()}
              </div>
              {request.admin_response && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Admin Response:</strong> {request.admin_response}
                </div>
              )}
            </div>

            {request.status === 'pending' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive-primary"
                  size="small"
                  onClick={() => handleResponse(request.id, 'rejected')}
                  icon={<FeatherX />}
                  disabled={loading}
                >
                  Reject
                </Button>
                <Button
                  size="small"
                  onClick={() => handleResponse(request.id, 'approved')}
                  icon={<FeatherCheck />}
                  disabled={loading}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRefinementManager;
