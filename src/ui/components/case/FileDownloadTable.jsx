import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../Table';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { FeatherDownload } from '@subframe/core';

const FileDownloadTable = ({
  caseData,
  downloadingFiles,
  handleFileDownload,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('casePage.fileDownload.uploadedFiles')}
      </span>
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
        {caseData.upper_jaw_scan_url && (
          <Table.Row>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {t('casePage.fileDownload.upperJawScan')}
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">{t('casePage.fileDownload.upperJaw')}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseData.upper_jaw_scan_url ? t('casePage.fileDownload.available') : t('casePage.fileDownload.notUploaded')}
              </span>
            </Table.Cell>
            <Table.Cell>
              {caseData.upper_jaw_scan_url && (
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(
                      caseData.upper_jaw_scan_url,
                      t('casePage.fileDownload.upperJawScan')
                    )
                  }
                  disabled={downloadingFiles.has(caseData.upper_jaw_scan_url)}
                />
              )}
            </Table.Cell>
          </Table.Row>
        )}
        {caseData.lower_jaw_scan_url && (
          <Table.Row>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {t('casePage.fileDownload.lowerJawScan')}
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">{t('casePage.fileDownload.lowerJaw')}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseData.lower_jaw_scan_url ? t('casePage.fileDownload.available') : t('casePage.fileDownload.notUploaded')}
              </span>
            </Table.Cell>
            <Table.Cell>
              {caseData.lower_jaw_scan_url && (
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(
                      caseData.lower_jaw_scan_url,
                      t('casePage.fileDownload.lowerJawScan')
                    )
                  }
                  disabled={downloadingFiles.has(caseData.lower_jaw_scan_url)}
                />
              )}
            </Table.Cell>
          </Table.Row>
        )}
        {caseData.bite_scan_url && (
          <Table.Row>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {t('casePage.fileDownload.biteScan')}
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">{t('casePage.fileDownload.bite')}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseData.bite_scan_url ? t('casePage.fileDownload.available') : t('casePage.fileDownload.notUploaded')}
              </span>
            </Table.Cell>
            <Table.Cell>
              {caseData.bite_scan_url && (
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(caseData.bite_scan_url, t('casePage.fileDownload.biteScan'))
                  }
                  disabled={downloadingFiles.has(caseData.bite_scan_url)}
                />
              )}
            </Table.Cell>
          </Table.Row>
        )}
        {caseData.compressed_scans_url && (
          <Table.Row>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {t('casePage.fileDownload.allInOne')}
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">{t('casePage.fileDownload.compressedFile')}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseData.compressed_scans_url ? t('casePage.fileDownload.available') : t('casePage.fileDownload.notUploaded')}
              </span>
            </Table.Cell>
            <Table.Cell>
              {caseData.compressed_scans_url && (
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(
                      caseData.compressed_scans_url,
                      t('casePage.fileDownload.allInOne')
                    )
                  }
                  disabled={downloadingFiles.has(caseData.compressed_scans_url)}
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
                  {t('casePage.fileDownload.additionalFile', { number: index + 1 })}
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">{t('casePage.fileDownload.additional')}</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {t('casePage.fileDownload.available')}
                </span>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(fileUrl, t('casePage.fileDownload.additionalFile', { number: index + 1 }))
                  }
                  disabled={downloadingFiles.has(fileUrl)}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        {!caseData.upper_jaw_scan_url &&
          !caseData.lower_jaw_scan_url &&
          !caseData.bite_scan_url &&
          !caseData.compressed_scans_url &&
          (!caseData.additional_files_urls ||
            caseData.additional_files_urls.length === 0) && (
            <Table.Row>
              <Table.Cell colSpan={4}>
                <span className="text-neutral-500 py-4">
                  {t('casePage.fileDownload.noFiles')}
                </span>
              </Table.Cell>
            </Table.Row>
          )}
      </Table>
    </div>
  );
};

export default FileDownloadTable;