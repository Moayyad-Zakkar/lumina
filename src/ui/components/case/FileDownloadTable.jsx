import React from 'react';
import { Table } from '../Table';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { FeatherDownload } from '@subframe/core';

const FileDownloadTable = ({
  caseData,
  downloadingFiles,
  handleFileDownload,
}) => {
  return (
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
        {caseData.compressed_scans_url && (
          <Table.Row>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                All-in-One
              </span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="neutral">Compressed File</Badge>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseData.compressed_scans_url ? 'Available' : 'Not uploaded'}
              </span>
            </Table.Cell>
            <Table.Cell>
              {caseData.compressed_scans_url && (
                <IconButton
                  icon={<FeatherDownload />}
                  onClick={() =>
                    handleFileDownload(
                      caseData.compressed_scans_url,
                      'All-in-One'
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
                    handleFileDownload(fileUrl, `Additional File ${index + 1}`)
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
                  No files uploaded for this case.
                </span>
              </Table.Cell>
            </Table.Row>
          )}
      </Table>
    </div>
  );
};

export default FileDownloadTable;
