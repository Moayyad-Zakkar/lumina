import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import DentalChart from '../DentalChart';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import {
  FeatherUser,
  FeatherCalendar,
  FeatherTag,
  FeatherHospital,
  FeatherBox,
  FeatherPhone,
  FeatherRefreshCw,
  FeatherPrinter,
  FeatherFileText,
} from '@subframe/core';

/* -------------------------------------------------------
   PrintField Component
------------------------------------------------------- */
const PrintField = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-sm text-gray-900">{value}</p>
  </div>
);

/* -------------------------------------------------------
   PrintableContent Component
------------------------------------------------------- */
const PrintableContent = React.forwardRef(
  ({ caseData, isAdmin, isRTL, t }, ref) => {
    // Helper to translate arch values
    const getArchLabel = (arch) => {
      if (!arch) return t('casePage.notSpecified');
      const archMap = {
        upper: 'caseSubmit.treatmentOptions.upperArch',
        lower: 'caseSubmit.treatmentOptions.lowerArch',
        both: 'caseSubmit.treatmentOptions.bothArches',
      };
      return t(archMap[arch] || arch);
    };

    // Helper to translate midline values
    const getMidlineLabel = (midline) => {
      if (!midline) return t('casePage.notSpecified');
      const midlineMap = {
        centered: 'caseSubmit.diagnosis.centered',
        shifted_right: 'caseSubmit.diagnosis.shiftedRight',
        shifted_left: 'caseSubmit.diagnosis.shiftedLeft',
      };
      return t(midlineMap[midline] || midline);
    };

    // Helper to translate class values
    const getClassLabel = (classValue) => {
      if (!classValue) return t('casePage.notSpecified');
      const classMap = {
        class_i: 'caseSubmit.diagnosis.classI',
        class_ii: 'caseSubmit.diagnosis.classII',
        class_iii: 'caseSubmit.diagnosis.classIII',
      };
      return t(classMap[classValue] || classValue);
    };

    return (
      <div
        ref={ref}
        className="p-8 print-container"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <style>{`
          @media print {
            .print-container {
              width: 100%;
              max-width: 100%;
            }
            
            /* Prevent page breaks inside small components */
            .print-no-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Prevent orphaned headers - keep header with next content */
            h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            /* Keep subsections together */
            .subsection-box {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Only force page break for very large components like dental chart */
            .force-page-break {
              page-break-before: always;
              break-before: always;
            }
            
            /* Footer on last page */
            .print-footer {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-600 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-600">3DA</h1>
            <p className="text-sm text-gray-600">
              {t('casePage.caseInformation')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {t('casePage.caseId')}: <strong>CASE-{caseData.id}</strong>
            </p>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {isAdmin
              ? t('casePage.caseInformation')
              : t('casePage.patientInformation')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <PrintField
                label={t('casePage.firstName')}
                value={capitalizeFirstSafe(caseData.first_name) || 'N/A'}
              />
              <PrintField
                label={t('casePage.lastName')}
                value={capitalizeFirstSafe(caseData.last_name) || 'N/A'}
              />

              {isAdmin && (
                <>
                  <PrintField
                    label={t('casePage.doctorName')}
                    value={
                      capitalizeFirstSafe(caseData.profiles?.full_name) || 'N/A'
                    }
                  />
                  <PrintField
                    label={t('casePage.phone')}
                    value={caseData.profiles?.phone || 'N/A'}
                  />
                </>
              )}
            </div>

            <div className="space-y-3">
              <PrintField
                label={t('casePage.caseId')}
                value={`CASE-${caseData.id}`}
              />

              {isAdmin && (
                <PrintField
                  label={t('casePage.clinic')}
                  value={caseData.profiles?.clinic || 'N/A'}
                />
              )}

              <PrintField
                label={t('casePage.alignerMaterial')}
                value={caseData.aligner_material || t('casePage.notSpecified')}
              />

              <PrintField
                label={t('casePage.submissionDate')}
                value={
                  caseData.created_at
                    ? new Date(caseData.created_at).toLocaleDateString()
                    : 'N/A'
                }
              />
            </div>
          </div>

          {caseData.refinement_reason && (
            <div className="mt-4 p-3 bg-gray-50 rounded print-no-break">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {t('casePage.refinementReason')}:
              </p>
              <p className="text-sm text-gray-600">
                {caseData.refinement_reason}
              </p>
            </div>
          )}
        </div>

        {/* Treatment & Diagnosis Details Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('casePage.treatmentOptionsTitle')}
          </h2>

          {/* Treatment Options */}
          <div className="mb-4 subsection-box">
            <h3 className="text-base font-semibold mb-2 text-gray-700">
              {t('casePage.treatmentOptions')}
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
              <PrintField
                label={t('caseSubmit.treatmentOptions.treatmentArch')}
                value={getArchLabel(caseData.treatment_arch)}
              />
              <PrintField
                label={t('caseSubmit.treatmentOptions.alignerMaterial')}
                value={caseData.aligner_material || t('casePage.notSpecified')}
              />
            </div>
          </div>

          {/* Midline Analysis */}
          {(caseData.upper_midline || caseData.lower_midline) && (
            <div className="mb-4 subsection-box">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                {t('casePage.midlineAnalysis')}
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                {caseData.upper_midline && (
                  <PrintField
                    label={t('caseSubmit.diagnosis.upperMidline')}
                    value={`${getMidlineLabel(caseData.upper_midline)}${
                      caseData.upper_midline_shift
                        ? ` (${caseData.upper_midline_shift} ${t(
                            'casePage.mm'
                          )})`
                        : ''
                    }`}
                  />
                )}
                {caseData.lower_midline && (
                  <PrintField
                    label={t('caseSubmit.diagnosis.lowerMidline')}
                    value={`${getMidlineLabel(caseData.lower_midline)}${
                      caseData.lower_midline_shift
                        ? ` (${caseData.lower_midline_shift} ${t(
                            'casePage.mm'
                          )})`
                        : ''
                    }`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Occlusal Relationship */}
          {(caseData.canine_right_class ||
            caseData.canine_left_class ||
            caseData.molar_right_class ||
            caseData.molar_left_class) && (
            <div className="mb-4 subsection-box">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                {t('casePage.occlusalRelationship')}
              </h3>
              <div className="bg-gray-50 p-3 rounded">
                {/* Canine Relationship */}
                {(caseData.canine_right_class ||
                  caseData.canine_left_class) && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      {t('caseSubmit.diagnosis.canineRelationship')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {caseData.canine_right_class && (
                        <PrintField
                          label={t('caseSubmit.diagnosis.rightSide')}
                          value={getClassLabel(caseData.canine_right_class)}
                        />
                      )}
                      {caseData.canine_left_class && (
                        <PrintField
                          label={t('caseSubmit.diagnosis.leftSide')}
                          value={getClassLabel(caseData.canine_left_class)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Molar Relationship */}
                {(caseData.molar_right_class || caseData.molar_left_class) && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      {t('caseSubmit.diagnosis.molarRelationship')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {caseData.molar_right_class && (
                        <PrintField
                          label={t('caseSubmit.diagnosis.rightSide')}
                          value={getClassLabel(caseData.molar_right_class)}
                        />
                      )}
                      {caseData.molar_left_class && (
                        <PrintField
                          label={t('caseSubmit.diagnosis.leftSide')}
                          value={getClassLabel(caseData.molar_left_class)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Case Notes Section */}
        {caseData.user_note && (
          <div className="mb-6 print-no-break">
            <div className="flex items-center gap-2 mb-3">
              <FeatherFileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                {isAdmin
                  ? t('casePage.caseNotes.doctorNotes')
                  : t('casePage.caseNotes.caseNotes')}
              </h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {caseData.user_note}
              </p>
            </div>
          </div>
        )}

        {/* Dental Chart Section */}
        {isAdmin && (
          <div className="mb-6 force-page-break">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {t('dentalChart.title')}
            </h2>
            <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-hidden print-no-break">
              <div>
                <DentalChart
                  initialStatus={caseData.tooth_status || {}}
                  readOnly={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print-footer">
          <p>
            {t('adminTreatmentPlan.print.footer', {
              date: new Date().toLocaleString(),
            })}
          </p>
        </div>
      </div>
    );
  }
);

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */
const CaseInformation = ({ caseData, isAdmin = false }) => {
  const { t, i18n } = useTranslation();
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const printRef = useRef();
  const isRTL = i18n.language === 'ar';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Case-${caseData.id}-Information`,
  });

  return (
    <>
      {/* Main Info Card */}
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <div className="flex w-full items-center justify-between">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {isAdmin
              ? t('casePage.caseInformation')
              : t('casePage.patientInformation')}
          </span>

          <Button
            size="small"
            variant="neutral-secondary"
            icon={<FeatherPrinter />}
            onClick={() => setShowPrintDialog(true)}
          >
            {t('casePage.printCaseInfo')}
          </Button>
        </div>

        <div className="flex w-full flex-wrap items-start gap-6">
          <div className="flex grow flex-col gap-2">
            <DataFieldHorizontal
              icon={<FeatherUser />}
              label={t('casePage.firstName')}
            >
              {capitalizeFirstSafe(caseData.first_name) || 'N/A'}
            </DataFieldHorizontal>

            <DataFieldHorizontal
              icon={<FeatherUser />}
              label={t('casePage.lastName')}
            >
              {capitalizeFirstSafe(caseData.last_name) || 'N/A'}
            </DataFieldHorizontal>

            {isAdmin && (
              <DataFieldHorizontal
                icon={<FeatherUser />}
                label={t('casePage.doctorName')}
              >
                {capitalizeFirstSafe(caseData.profiles?.full_name) || 'N/A'}
              </DataFieldHorizontal>
            )}

            {isAdmin && (
              <DataFieldHorizontal
                icon={<FeatherPhone />}
                label={t('casePage.phone')}
              >
                {caseData.profiles?.phone || 'N/A'}
              </DataFieldHorizontal>
            )}

            <DataFieldHorizontal
              icon={<FeatherCalendar />}
              label={t('casePage.submissionDate')}
            >
              {caseData.created_at
                ? new Date(caseData.created_at).toLocaleDateString()
                : 'N/A'}
            </DataFieldHorizontal>
          </div>

          <div className="flex grow flex-col gap-2">
            <DataFieldHorizontal
              icon={<FeatherTag />}
              label={t('casePage.caseId')}
            >
              CASE-{caseData.id}
            </DataFieldHorizontal>

            {isAdmin && (
              <DataFieldHorizontal
                icon={<FeatherHospital />}
                label={t('casePage.clinic')}
              >
                {caseData.profiles?.clinic || 'N/A'}
              </DataFieldHorizontal>
            )}

            <DataFieldHorizontal
              icon={<FeatherBox />}
              label={t('casePage.alignerMaterial')}
            >
              <Badge>
                {caseData.aligner_material || t('casePage.notSpecified')}
              </Badge>
            </DataFieldHorizontal>

            {caseData.refinement_reason && (
              <DataFieldHorizontal
                icon={<FeatherRefreshCw />}
                label={t('casePage.refinementReason')}
              >
                {caseData.refinement_reason}
              </DataFieldHorizontal>
            )}
          </div>
        </div>
      </div>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <Dialog.Content className="w-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-1 py-3 w-full">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('casePage.printCaseInfo')}
            </span>

            <Button
              variant="brand-primary"
              icon={<FeatherPrinter />}
              onClick={() => {
                handlePrint();
                setShowPrintDialog(false);
              }}
              className="w-auto"
            >
              {t('casePage.printCaseInfo')}
            </Button>
          </div>

          <div className="border border-neutral-border rounded-lg bg-white">
            {/* Print Content */}
            <PrintableContent
              ref={printRef}
              caseData={caseData}
              isAdmin={isAdmin}
              isRTL={isRTL}
              t={t}
            />
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
};

export default CaseInformation;
