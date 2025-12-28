import { useNavigate } from 'react-router';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { useTranslation } from 'react-i18next';
import { Table } from './Table';
import { Loader } from './Loader';
import CaseStatusBadge from './CaseStatusBadge';

const DesktopCasesTable = ({ cases, loading }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>{t('cases.patientName')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.status')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.submissionDate')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.caseId')}</Table.HeaderCell>
        </Table.HeaderRow>
      }
    >
      {loading ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <div className="flex min-h-[100px] justify-center items-center">
              <Loader size="medium" />
            </div>
          </Table.Cell>
        </Table.Row>
      ) : cases.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <div className="text-center py-8 text-neutral-500">
              {t('cases.noCases')}
            </div>
          </Table.Cell>
        </Table.Row>
      ) : (
        cases.map((caseItem) => (
          <Table.Row
            key={caseItem.id}
            clickable
            onClick={() => navigate(`/app/cases/${caseItem.id}`)}
          >
            <Table.Cell>
              {capitalizeFirstSafe(caseItem.first_name)}{' '}
              {capitalizeFirstSafe(caseItem.last_name)}
            </Table.Cell>
            <Table.Cell>
              <CaseStatusBadge status={caseItem.status} />
            </Table.Cell>
            <Table.Cell>
              {new Date(caseItem.created_at).toLocaleDateString()}
            </Table.Cell>
            <Table.Cell>CASE-{caseItem.id}</Table.Cell>
          </Table.Row>
        ))
      )}
    </Table>
  );
};

export default DesktopCasesTable;
