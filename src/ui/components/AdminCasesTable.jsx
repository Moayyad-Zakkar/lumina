import { useNavigate } from 'react-router';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { useTranslation } from 'react-i18next';
import { Table } from './Table';

import { Avatar } from './Avatar';
import CaseStatusBadge from './CaseStatusBadge';
import { Loader } from './Loader';

const AdminCasesTable = ({ cases, loading, hasActiveFilters }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Table
      header={
        <Table.HeaderRow>
          <Table.HeaderCell>{t('cases.patient')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.doctor')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.clinic')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.filters.material')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.phone')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.status')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.submitted')}</Table.HeaderCell>
          <Table.HeaderCell>{t('cases.caseId')}</Table.HeaderCell>
        </Table.HeaderRow>
      }
    >
      {loading ? (
        <Table.Row>
          <Table.Cell colSpan={8}>
            <div className="flex w-full h-full min-h-[100px] justify-center items-center">
              <Loader size="medium" />
            </div>
          </Table.Cell>
        </Table.Row>
      ) : cases.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={8}>
            <div className="text-center py-8">
              <span className="text-neutral-500">
                {hasActiveFilters
                  ? t('cases.noMatchingCases')
                  : t('cases.noCases')}
              </span>
            </div>
          </Table.Cell>
        </Table.Row>
      ) : (
        cases.map((caseItem) => (
          <Table.Row
            key={caseItem.id}
            clickable
            onClick={() => navigate(`/admin/cases/${caseItem.id}`)}
          >
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                {caseItem.first_name} {caseItem.last_name}
              </span>
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Avatar
                  size="small"
                  image={caseItem.profiles?.avatar_url || undefined}
                >
                  {!caseItem.profiles?.avatar_url && (
                    <>
                      {capitalizeFirstSafe(
                        caseItem.profiles?.full_name?.split(' ')[0]?.[0]
                      )}
                      {capitalizeFirstSafe(
                        caseItem.profiles?.full_name
                          ?.split(' ')
                          .slice(-1)[0]?.[0]
                      )}
                    </>
                  )}
                </Avatar>
                <span className="whitespace-nowrap text-body font-body text-neutral-700">
                  {caseItem.profiles?.full_name || '-'}
                </span>
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseItem.profiles?.clinic || '-'}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-700">
                {caseItem.aligner_material || '-'}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span
                className="whitespace-nowrap text-body font-body text-neutral-500"
                style={{ direction: 'ltr' }}
              >
                {caseItem.profiles?.phone || '-'}
              </span>
            </Table.Cell>
            <Table.Cell>
              <CaseStatusBadge status={caseItem.status} />
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseItem.created_at
                  ? new Date(caseItem.created_at).toLocaleDateString()
                  : '-'}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                {caseItem.id ? `CASE-${caseItem.id}` : '-'}
              </span>
            </Table.Cell>
          </Table.Row>
        ))
      )}
    </Table>
  );
};

export default AdminCasesTable;
