import React from 'react';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { FeatherSearch } from '@subframe/core';
import { FeatherChevronDown } from '@subframe/core';
import { IconButton } from '../components/IconButton';
import { FeatherRefreshCw } from '@subframe/core';
import { FeatherFilter } from '@subframe/core';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { useState, useEffect } from 'react';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import Headline from '../components/Headline';
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from 'react-router';

const CasesPage = () => {
  const { cases, totalCases, page, search, CASES_PER_PAGE, error } =
    useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  console.log('CasesPage data:', {
    cases,
    totalCases,
    page,
    search,
    CASES_PER_PAGE,
    error,
  });

  const [searchInput, setSearchInput] = useState(search);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔁 Handle debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      const trimmed = searchInput.trim();
      const params = new URLSearchParams();
      if (trimmed.length >= 3) params.set('search', trimmed);
      params.set('page', '1');
      navigate(`/app/cases?${params.toString()}`);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchInput, navigate]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    navigate(`/app/cases?${params.toString()}`);
  };

  // Show error at the top, but keep the rest of the page visible
  return (
    <>
      {error && <Error error={error} />}
      <Headline>Cases</Headline>

      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex grow shrink-0 basis-0 items-center gap-2">
          <TextField
            className="w-100"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search cases..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </TextField>
          <Button variant="neutral-tertiary" iconRight={<FeatherChevronDown />}>
            Status
          </Button>
          <Button variant="neutral-tertiary" iconRight={<FeatherChevronDown />}>
            Date Range
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={<FeatherRefreshCw />} />
          <IconButton icon={<FeatherFilter />} />
        </div>
      </div>
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>Patient Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Submission Date</Table.HeaderCell>
            <Table.HeaderCell>Case ID</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {isLoading ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : !cases || cases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <span className="text-neutral-500 py-4">No cases found.</span>
            </Table.Cell>
          </Table.Row>
        ) : (
          cases?.map((caseItem) => (
            <Table.Row
              key={caseItem.id}
              clickable
              onClick={() => {
                navigate(`/app/cases/${caseItem.id}`);
              }}
            >
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  {capitalizeFirstSafe(caseItem.first_name)}{' '}
                  {capitalizeFirstSafe(caseItem.last_name)}
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge
                  variant={
                    caseItem.status === 'completed'
                      ? 'success'
                      : caseItem.status === 'pending'
                      ? 'warning'
                      : caseItem.status === 'in_progress'
                      ? undefined
                      : 'error'
                  }
                >
                  {caseItem.status === 'in_progress'
                    ? 'In Progress'
                    : caseItem.status === 'pending'
                    ? 'Pending Review'
                    : caseItem.status === 'completed'
                    ? 'Completed'
                    : caseItem.status}
                </Badge>
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
      <div className="flex w-full items-center justify-between">
        <span className="text-body font-body text-subtext-color">
          {totalCases === 0
            ? 'No cases to show'
            : `Showing ${Math.min(
                (page - 1) * CASES_PER_PAGE + 1,
                totalCases
              )} - ${Math.min(
                page * CASES_PER_PAGE,
                totalCases
              )} of ${totalCases} cases`}
        </span>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Button
              variant="neutral-secondary"
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
          )}
          {page * CASES_PER_PAGE < totalCases && (
            <Button
              variant="neutral-secondary"
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CasesPage;
