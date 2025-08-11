import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { FeatherDownload } from '@subframe/core';
import { FeatherPlay } from '@subframe/core';
import { IconButton } from '../components/IconButton';
import { FeatherX } from '@subframe/core';
import { Alert } from '../components/Alert';
import { FeatherAlertTriangle } from '@subframe/core';
import { DataFieldHorizontal } from '../components/DataFieldHorizontal';
import { FeatherUser } from '@subframe/core';
import { FeatherCalendar } from '@subframe/core';
import { FeatherTag } from '@subframe/core';
import { Badge } from '../components/Badge';
import { FeatherBox } from '@subframe/core';
import { FeatherPrinter } from '@subframe/core';
import { FeatherGrid } from '@subframe/core';
import { FeatherClock } from '@subframe/core';
import { FeatherDollarSign } from '@subframe/core';
import { FeatherPlusCircle } from '@subframe/core';
import { FeatherCalculator } from '@subframe/core';
import { FeatherCheck } from '@subframe/core';
import { Table } from '../components/Table';
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { Link, useLoaderData } from 'react-router';
import Error from '../components/Error';
import toast from 'react-hot-toast';
import CaseStatusBadge from '../components/CaseStatusBadge';
import supabase from '../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../helper/formatText';

const CasePage = () => {
  const { caseData, error } = useLoaderData();
  const [status, setStatus] = useState(caseData?.status);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);

  // Mark notifications for this case as read when the doctor opens the case
  useEffect(() => {
    const markCaseNotificationsRead = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        if (!caseData?.id) return;
        await supabase
          .from('notifications')
          .update({ status: 'read' })
          .eq('recipient_id', user.id)
          .eq('case_id', caseData.id)
          .eq('status', 'unread');
      } catch {
        // ignore
      }
    };
    markCaseNotificationsRead();
  }, [caseData?.id]);

  const alertContent = useMemo(() => {
    switch (status) {
      case 'submitted':
        return {
          title: 'Waiting for 3DA Acceptance',
          description:
            "You're case is submitted successfully, please wait for 3DA acceptance",
        };
      case 'awaiting_user_approval':
        return {
          title: 'Treatment Plan Ready for Approval',
          description:
            'Please review the aligners count and estimated duration, then approve or decline the plan.',
        };
      case 'approved':
        return {
          title: 'Treatment Plan Approved',
          description:
            'Your treatment plan has been approved. Production will start soon.',
        };
      case 'in_production':
        return {
          title: 'Aligners Are In Production',
          description:
            'Your aligners are being manufactured. You will be notified when they are ready for delivery.',
        };
      case 'ready_for_delivery':
        return {
          title: 'Aligners Ready for Delivery',
          description:
            'Your aligners are ready. 3DA will contact you to arrange pickup or delivery.',
        };
      case 'delivered':
        return {
          title: 'Aligners Delivered',
          description:
            'You have received the aligners. Please advice your patient to follow the wear schedule and instructions.',
        };
      case 'completed':
        return {
          title: 'Treatment Completed',
          description: 'The treatment is complete. Thank you for choosing us!',
        };
      default:
        return {
          title: 'Case Updates',
          description:
            'We will notify you here when there are updates to your treatment plan.',
        };
    }
  }, [status]);

  if (error) {
    return <Error error={error} />;
  }

  if (!caseData) {
    return <p className="text-neutral-500">Case not found.</p>;
  }
  const showPlanSection = [
    'awaiting_user_approval',
    'approved',
    'in_production',
    'ready_for_delivery',
    'delivered',
    'completed',
  ].includes(status);

  const approvePlan = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'approved' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('approved');
    } catch (e) {
      setActionError(null);
      toast.error(e.message || 'Failed to approve plan');
    } finally {
      setSaving(false);
    }
  };

  const declinePlan = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'user_rejected' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('user_rejected');
    } catch (e) {
      setActionError(null);
      toast.error(e.message || 'Failed to decline plan');
    } finally {
      setSaving(false);
    }
  };

  const requestAbortion = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'user_rejected' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('user_rejected');
    } catch (e) {
      setActionError(null);
      toast.error(e.message || 'Failed to request abortion');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/app/cases">
            <Breadcrumbs.Item>Cases</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>Case Details</Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-heading-2 font-heading-2 text-default-font">
              Case-{caseData.id}
            </span>
            <CaseStatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="neutral-secondary" icon={<FeatherDownload />}>
              Download Files
            </Button>
            <Button icon={<FeatherPlay />}>View Slideshow</Button>
          </div>
        </div>
      </div>
      {showPlanSection && (
        <Alert
          variant="brand"
          icon={<FeatherAlertTriangle />}
          title={alertContent.title}
          description={alertContent.description}
          actions={null}
        />
      )}
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Patient Information
          </span>
          <div className="flex w-full flex-wrap items-start gap-6">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
              <DataFieldHorizontal icon={<FeatherUser />} label="First Name">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {capitalizeFirstSafe(caseData.first_name) || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal icon={<FeatherUser />} label="Last Name">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {capitalizeFirstSafe(caseData.last_name) || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherCalendar />}
                label="Submission Date"
              >
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {caseData.created_at
                    ? new Date(caseData.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </DataFieldHorizontal>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
              <DataFieldHorizontal icon={<FeatherTag />} label="Case ID">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  CASE-{caseData.id}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherBox />}
                label="Aligner Material"
              >
                <Badge>{caseData.aligner_material || 'Not specified'}</Badge>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherPrinter />}
                label="Printing Method"
              >
                <Badge>{caseData.printing_method || 'Not specified'}</Badge>
              </DataFieldHorizontal>
            </div>
          </div>
        </div>
        {showPlanSection && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Treatment Plan Review
            </span>
            {actionError && <Error error={actionError} />}
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex w-full flex-wrap items-start gap-6">
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Upper Jaw Aligners"
                  >
                    <Badge>{caseData.upper_jaw_aligners ?? '—'} Aligners</Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Lower Jaw Aligners"
                  >
                    <Badge>{caseData.lower_jaw_aligners ?? '—'} Aligners</Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherClock />}
                    label="Estimated Duration"
                  >
                    <span className="whitespace-nowrap text-body font-body text-default-font">
                      {caseData.estimated_duration_months ?? '—'} Months
                    </span>
                  </DataFieldHorizontal>
                </div>
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                  <DataFieldHorizontal
                    icon={<FeatherDollarSign />}
                    label="Base Price"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      $—
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherPlusCircle />}
                    label="Additional Charges"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      $—
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherCalculator />}
                    label="Total Cost"
                  >
                    <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                      $—
                    </span>
                  </DataFieldHorizontal>
                </div>
              </div>
              <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />
              <div className="flex w-full items-center justify-between">
                <span className="text-body font-body text-subtext-color">
                  {status === 'awaiting_user_approval'
                    ? 'Please review the treatment plan details and choose to approve or decline.'
                    : status === 'approved'
                    ? 'Your plan is approved. Production will start soon.'
                    : status === 'in_production'
                    ? 'Your aligners are currently being manufactured.'
                    : status === 'ready_for_delivery'
                    ? 'Your aligners are ready for delivery.'
                    : status === 'delivered'
                    ? 'Your aligners have been delivered. Follow your treatment schedule.'
                    : status === 'completed'
                    ? 'Your treatment is completed.'
                    : ''}
                </span>
                <div className="flex items-center gap-2">
                  {/*status === 'awaiting_user_approval' ? (
                    <>
                      <Button
                        variant="neutral-secondary"
                        disabled={saving}
                        onClick={declinePlan}
                      >
                        Decline Plan
                      </Button>
                      <Button
                        icon={<FeatherCheck />}
                        disabled={saving}
                        onClick={approvePlan}
                      >
                        Approve Plan
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive-primary"
                      icon={<FeatherX />}
                      disabled={saving}
                      onClick={requestAbortion}
                    >
                      Request Abortion
                    </Button>
                  )*/}
                  {status === 'awaiting_user_approval' && (
                    <>
                      <Button
                        variant="neutral-secondary"
                        disabled={saving}
                        onClick={declinePlan}
                      >
                        Decline Plan
                      </Button>
                      <Button
                        icon={<FeatherCheck />}
                        disabled={saving}
                        onClick={approvePlan}
                      >
                        Approve Plan
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Uploaded Files
          </span>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>File Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>URL</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {caseData.upper_jaw_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Upper Jaw Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Upper Jaw</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.upper_jaw_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.upper_jaw_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        window.open(caseData.upper_jaw_scan_url, '_blank')
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.lower_jaw_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Lower Jaw Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Lower Jaw</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.lower_jaw_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.lower_jaw_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        window.open(caseData.lower_jaw_scan_url, '_blank')
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.bite_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Bite Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Bite</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.bite_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.bite_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        window.open(caseData.bite_scan_url, '_blank')
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.additional_files_urls &&
              caseData.additional_files_urls.length > 0 &&
              caseData.additional_files_urls.map((fileUrl, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                      Additional File {index + 1}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="neutral">Additional</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      Available
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() => window.open(fileUrl, '_blank')}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            {!caseData.upper_jaw_scan_url &&
              !caseData.lower_jaw_scan_url &&
              !caseData.bite_scan_url &&
              (!caseData.additional_files_urls ||
                caseData.additional_files_urls.length === 0) && (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <span className="text-neutral-500 py-4">
                      No files uploaded for this case.
                    </span>
                  </Table.Cell>
                </Table.Row>
              )}
          </Table>
        </div>
        <div className="flex w-full items-center justify-end">
          {(status === 'approved' || status === 'in_production') && (
            <Button
              variant="destructive-primary"
              icon={<FeatherX />}
              disabled={saving}
              onClick={() => setIsAbortDialogOpen(true)}
              className="w-auto"
            >
              Request Abortion
            </Button>
          )}
        </div>
      </div>

      {isAbortDialogOpen && (
        <Dialog open={isAbortDialogOpen} onOpenChange={setIsAbortDialogOpen}>
          <Dialog.Content className="p-6 max-w-[480px]">
            <div className="flex items-start gap-3">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Confirm Abort Request
              </span>
            </div>
            <div className="mt-2 text-body font-body text-subtext-color">
              This will request aborting the case. This action may halt
              production if already started. Are you sure?
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                onClick={() => setIsAbortDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive-primary"
                onClick={async () => {
                  await requestAbortion();
                  setIsAbortDialogOpen(false);
                }}
                disabled={saving}
                icon={<FeatherAlertTriangle />}
              >
                Confirm Abort
              </Button>
            </div>
          </Dialog.Content>
        </Dialog>
      )}
    </>
  );
};

export default CasePage;
