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
import { FeatherRefreshCw } from '@subframe/core';
import { FeatherFileText } from '@subframe/core';
import { FeatherEdit3 } from '@subframe/core';
import { FeatherSave } from '@subframe/core';
import { Table } from '../components/Table';
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { Link, useLoaderData } from 'react-router';
import Error from '../components/Error';
import toast from 'react-hot-toast';
import CaseStatusBadge from '../components/CaseStatusBadge';
import supabase from '../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../helper/formatText';
import RefinementSection from '../components/RefinementSection';
import RefinementHistory from '../components/RefinementHistory';
import { downloadFile } from '../../helper/storageUtils';
import DentalChart from '../components/DentalChart';

const CasePage = () => {
  const { caseData, error } = useLoaderData();
  const [status, setStatus] = useState(caseData?.status);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(caseData?.user_note || '');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  // Enhanced file download handler - SIMPLIFIED
  const handleFileDownload = async (storedUrl, fileName = 'download') => {
    if (!storedUrl) {
      toast.error('No file URL available');
      return;
    }

    // Add to downloading set to show loading state
    setDownloadingFiles((prev) => new Set([...prev, storedUrl]));

    try {
      console.log('Starting download for:', fileName);

      // Use the simplified downloadFile function instead of downloadFileFromStorage
      const result = await downloadFile(storedUrl);

      if (result.success) {
        toast.success(`${fileName} downloaded successfully`);
      } else {
        toast.error(`Failed to download ${fileName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message}`);
    } finally {
      // Remove from downloading set
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(storedUrl);
        return newSet;
      });
    }
  };

  // Download all files function - IMPROVED with better error handling
  const handleDownloadAllFiles = async () => {
    const filesToDownload = [];

    // Build list of files to download
    if (caseData.upper_jaw_scan_url) {
      filesToDownload.push({
        url: caseData.upper_jaw_scan_url,
        name: 'Upper Jaw Scan',
      });
    }
    if (caseData.lower_jaw_scan_url) {
      filesToDownload.push({
        url: caseData.lower_jaw_scan_url,
        name: 'Lower Jaw Scan',
      });
    }
    if (caseData.bite_scan_url) {
      filesToDownload.push({
        url: caseData.bite_scan_url,
        name: 'Bite Scan',
      });
    }
    if (caseData.additional_files_urls?.length > 0) {
      caseData.additional_files_urls.forEach((url, index) => {
        filesToDownload.push({
          url,
          name: `Additional File ${index + 1}`,
        });
      });
    }

    if (filesToDownload.length === 0) {
      toast.error('No files available for download');
      return;
    }

    // Show initial toast
    const downloadToast = toast.loading(
      `Downloading ${filesToDownload.length} file(s)...`
    );

    let successCount = 0;
    let failCount = 0;

    // Download files with error tracking
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];

      try {
        // Add to downloading set
        setDownloadingFiles((prev) => new Set([...prev, file.url]));

        const result = await downloadFile(file.url);

        if (result.success) {
          successCount++;
          //console.log(`✓ Downloaded: ${file.name}`);
        } else {
          failCount++;
          console.error(`✗ Failed: ${file.name} - ${result.error}`);
        }
      } catch (error) {
        failCount++;
        console.error(`✗ Failed: ${file.name} - ${error.message}`);
      } finally {
        // Remove from downloading set
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file.url);
          return newSet;
        });
      }

      // Small delay between downloads to avoid overwhelming browser
      if (i < filesToDownload.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced to 500ms
      }
    }

    // Update toast with final result
    toast.dismiss(downloadToast);

    if (failCount === 0) {
      toast.success(`All ${successCount} files downloaded successfully!`);
    } else if (successCount === 0) {
      toast.error(`Failed to download all ${filesToDownload.length} files`);
    } else {
      toast.success(`Downloaded ${successCount} files (${failCount} failed)`);
    }
  };

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
            'Your case is submitted successfully, please wait for 3DA acceptance',
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
            'You have received the aligners. Please advise your patient to follow the wear schedule and instructions.',
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
      setActionError(e.message || 'Failed to approve plan');
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
      setActionError(e.message || 'Failed to decline plan');
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
      toast.success('Abortion request submitted');
    } catch (e) {
      setActionError(e.message || 'Failed to request abortion');
      toast.error(e.message || 'Failed to request abortion');
    } finally {
      setSaving(false);
    }
  };

  // Note management functions
  const handleEditNote = () => {
    setIsEditingNote(true);
    setNoteError(null);
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setNoteText(caseData?.user_note || '');
    setNoteError(null);
  };

  const handleSaveNote = async () => {
    try {
      setNoteSaving(true);
      setNoteError(null);

      const { error: updateError } = await supabase
        .from('cases')
        .update({ user_note: noteText.trim() || null })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      // Update local case data
      caseData.user_note = noteText.trim() || null;
      setIsEditingNote(false);
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      setNoteError(error.message || 'Failed to save note');
      toast.error('Failed to save note');
    } finally {
      setNoteSaving(false);
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
            {caseData.parent_case_id && (
              <Badge variant="brand" icon={<FeatherRefreshCw />}>
                Refinement #{caseData.refinement_number || 1}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {caseData.parent_case_id && (
              <Button
                variant="neutral-secondary"
                icon={<FeatherRefreshCw />}
                asChild
              >
                <Link to={`/app/cases/${caseData.parent_case_id}`}>
                  View Original Case
                </Link>
              </Button>
            )}
            <Button
              variant="neutral-secondary"
              icon={<FeatherDownload />}
              onClick={handleDownloadAllFiles}
              disabled={downloadingFiles.size > 0}
            >
              {downloadingFiles.size > 0
                ? 'Downloading...'
                : 'Download All Files'}
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
              {caseData.refinement_reason && (
                <DataFieldHorizontal
                  icon={<FeatherRefreshCw />}
                  label="Refinement Reason"
                >
                  <span className="text-body font-body text-default-font">
                    {caseData.refinement_reason}
                  </span>
                </DataFieldHorizontal>
              )}
            </div>
          </div>
        </div>

        {/* Case Notes Section */}
        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <div className="flex w-full items-center justify-between">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Case Notes
            </span>
            {!isEditingNote && (
              <Button
                variant="neutral-secondary"
                size="small"
                icon={<FeatherEdit3 />}
                onClick={handleEditNote}
              >
                {caseData.user_note ? 'Edit Note' : 'Add Note'}
              </Button>
            )}
          </div>

          {noteError && (
            <div className="w-full">
              <Error error={noteError} />
            </div>
          )}

          <div className="w-full">
            {isEditingNote ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="noteTextarea"
                    className="text-body-bold font-body-bold text-default-font"
                  >
                    Additional Notes
                  </label>
                  <textarea
                    id="noteTextarea"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter any special instructions, patient history, or additional details..."
                    rows={6}
                    className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] placeholder:text-subtext-color"
                    disabled={noteSaving}
                  />
                  <span className="text-caption font-caption text-subtext-color">
                    Add any additional information or special instructions for
                    this case
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    icon={<FeatherSave />}
                    onClick={handleSaveNote}
                    disabled={noteSaving}
                    size="small"
                  >
                    {noteSaving ? 'Saving...' : 'Save Note'}
                  </Button>
                  <Button
                    variant="neutral-secondary"
                    onClick={handleCancelEditNote}
                    disabled={noteSaving}
                    size="small"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {caseData.user_note ? (
                  <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm hover:border-neutral-300 transition-colors">
                    <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                      {caseData.user_note}
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-neutral-50 text-sm text-neutral-500 rounded-md p-3">
                    No notes added yet
                  </div>
                )}
                {/*
                // this is another styling for the no notes added yet
                <div className="flex items-center justify-center py-8 text-subtext-color border-2 border-dashed border-neutral-300 rounded-lg">
                    <div className="text-center">
                      <FeatherFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-body font-body">No notes added yet</p>
                      <p className="text-caption font-caption">
                        Click "Add Note" to include additional information
                      </p>
                    </div>
                  </div>*/}
              </div>
            )}
          </div>
        </div>

        {/* Dental Chart */}
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div>
            <DentalChart
              initialStatus={caseData.tooth_status || {}}
              onChange={(updated) =>
                supabase
                  .from('cases')
                  .update({ tooth_status: updated })
                  .eq('id', caseData.id)
              }
              readOnly={true}
            />
          </div>
        </div>

        {/* Treatment Plan Section */}
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
                    label="Case Study Fee"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      $
                      {caseData.case_study_fee
                        ? parseFloat(caseData.case_study_fee).toFixed(2)
                        : '0'}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Aligners Price"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      $
                      {caseData.aligners_price
                        ? parseFloat(caseData.aligners_price).toFixed(2)
                        : '0'}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherPlusCircle />}
                    label="Delivery Charges"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      $
                      {caseData.delivery_charges
                        ? parseFloat(caseData.delivery_charges).toFixed(2)
                        : '0'}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherCalculator />}
                    label="Total Cost"
                  >
                    <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                      $
                      {caseData.total_cost
                        ? parseFloat(caseData.total_cost).toFixed(2)
                        : '0'}
                    </span>
                  </DataFieldHorizontal>
                </div>
              </div>

              {/* Admin Note Section */}
              {caseData.admin_note && (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      3DA Notes
                    </span>
                  </div>

                  <div className="w-full">
                    <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
                      <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                        {caseData.admin_note}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* End of Admin notes */}

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
                <Table.HeaderCell>Status</Table.HeaderCell>
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
                        handleFileDownload(
                          caseData.upper_jaw_scan_url,
                          'Upper Jaw Scan'
                        )
                      }
                      disabled={downloadingFiles.has(
                        caseData.upper_jaw_scan_url
                      )}
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
                        handleFileDownload(
                          caseData.lower_jaw_scan_url,
                          'Lower Jaw Scan'
                        )
                      }
                      disabled={downloadingFiles.has(
                        caseData.lower_jaw_scan_url
                      )}
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
                        handleFileDownload(caseData.bite_scan_url, 'Bite Scan')
                      }
                      disabled={downloadingFiles.has(caseData.bite_scan_url)}
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
                      onClick={() =>
                        handleFileDownload(
                          fileUrl,
                          `Additional File ${index + 1}`
                        )
                      }
                      disabled={downloadingFiles.has(fileUrl)}
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

        {/* Refinement Section */}
        <RefinementSection caseData={caseData} />

        {/* Refinement History */}
        <RefinementHistory caseData={caseData} />
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
