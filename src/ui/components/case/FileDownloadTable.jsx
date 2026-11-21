import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../Table';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { FeatherDownload } from '@subframe/core';
import { useIsMobile } from '../../../hooks/useIsMobile';

const FileDownloadTable = ({
  caseData,
  downloadingFiles,
  handleFileDownload,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Single source of truth for every downloadable file on the case
  const files = [];

  if (caseData.upper_jaw_scan_url) {
    files.push({
      key: 'upper',
      url: caseData.upper_jaw_scan_url,
      name: t('casePage.fileDownload.upperJawScan'),
      type: t('casePage.fileDownload.upperJaw'),
    });
  }
  if (caseData.lower_jaw_scan_url) {
    files.push({
      key: 'lower',
      url: caseData.lower_jaw_scan_url,
      name: t('casePage.fileDownload.lowerJawScan'),
      type: t('casePage.fileDownload.lowerJaw'),
    });
  }
  if (caseData.bite_scan_url) {
    files.push({
      key: 'bite',
      url: caseData.bite_scan_url,
      name: t('casePage.fileDownload.biteScan'),
      type: t('casePage.fileDownload.bite'),
    });
  }
  if (caseData.compressed_scans_url) {
    files.push({
      key: 'compressed',
      url: caseData.compressed_scans_url,
      name: t('casePage.fileDownload.allInOne'),
      type: t('casePage.fileDownload.compressedFile'),
    });
  }
  (caseData.additional_files_urls || []).forEach((fileUrl, index) => {
    files.push({
      key: `additional-${index}`,
      url: fileUrl,
      name: t('casePage.fileDownload.additionalFile', { number: index + 1 }),
      type: t('casePage.fileDownload.additional'),
    });
  });

  const renderDownloadButton = (file) => (
    <IconButton
      icon={<FeatherDownload />}
      onClick={() => handleFileDownload(file.url, file.name)}
      disabled={downloadingFiles.has(file.url)}
    />
  );

  // Mobile: one compact card per file
  const renderMobileList = () => (
    <div className="flex w-full flex-col gap-2">
      {files.length === 0 ? (
        <span className="py-4 text-center text-body font-body text-neutral-500">
          {t('casePage.fileDownload.noFiles')}
        </span>
      ) : (
        files.map((file) => (
          <div
            key={file.key}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-solid border-neutral-border px-3 py-3"
          >
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="w-full truncate text-body-bold font-body-bold text-neutral-700">
                {file.name}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{file.type}</Badge>
                <span className="text-caption font-caption text-neutral-500">
                  {t('casePage.fileDownload.available')}
                </span>
              </div>
            </div>
            <div className="flex-none">{renderDownloadButton(file)}</div>
          </div>
        ))
      )}
    </div>
  );

  // Desktop: original table layout
  const renderDesktopTable = () => (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>{t('casePage.fileDownload.fileName')}</Table.HeaderCell>
          <Table.HeaderCell>{t('casePage.fileDownload.type')}</Table.HeaderCell>
          <Table.HeaderCell>{t('casePage.fileDownload.status')}</Table.HeaderCell>
          <Table.HeaderCell>{t('casePage.fileDownload.actions')}</Table.HeaderCell>
        </Table.HeaderRow>
      }
    >
      {files.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <span className="py-4 text-neutral-500">
              {t('casePage.fileDownload.noFiles')}
            </span>
          </Table.Cell>
        </Table.Row>
      ) : (
        files.map((file) => (
          <Table.Row key={file.key}>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {file.name}
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">{file.type}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {t('casePage.fileDownload.available')}
              </span>
            </Table.Cell>
            <Table.Cell>{renderDownloadButton(file)}</Table.Cell>
          </Table.Row>
        ))
      )}
    </Table>
  );

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-4 pt-4 pb-5 shadow-sm md:px-6 md:pb-6">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('casePage.fileDownload.uploadedFiles')}
      </span>
      {isMobile ? renderMobileList() : renderDesktopTable()}
    </div>
  );
};

export default FileDownloadTable;