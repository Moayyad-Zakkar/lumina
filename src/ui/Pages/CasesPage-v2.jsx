import React from 'react';
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
import supabase from '../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import Headline from '../components/Headline';
import { useNavigate } from 'react-router';
import CaseStatusBadge from '../components/CaseStatusBadge';

const CASES_PER_PAGE = 10;

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        let baseQuery = supabase.from('cases').select('*', { count: 'exact' });
        if (search.length >= 3) {
          baseQuery = baseQuery.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
          );
        }

        // Get total count
        const { count: total, error: countError } = await baseQuery;
        if (countError) throw countError;
        setTotalCases(total);

        // Fetch paginated cases
        const from = (page - 1) * CASES_PER_PAGE;
        const to = from + CASES_PER_PAGE - 1;
        let query = baseQuery
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        const { data, error } = await query;
        if (error) throw error;
        setCases(data);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [page, search]);

  // Handle search input and debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Show error at the top, but keep the rest of the page visible
  return (
    <>
      {error && <Error error={error} />}
      <Headline>Cases</Headline>

      <div className="flex w-full justify-between items-center gap-4">
        {/* Left Side: Search + Status + Date */}
        <div className="flex items-center gap-2 flex-1">
          {/* Search Bar with bounded width */}
          <div className="flex-grow max-w-[300px] min-w-[200px]">
            <TextField
              className="w-full"
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
          </div>

          {/* Compact buttons */}
          <div className="flex-shrink-0 flex gap-2">
            <Button
              size="sm"
              variant="neutral-tertiary"
              className="px-3"
              iconRight={<FeatherChevronDown />}
            >
              Status
            </Button>
            <Button
              size="sm"
              variant="neutral-tertiary"
              className="px-3"
              iconRight={<FeatherChevronDown />}
            >
              Date
            </Button>
          </div>
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
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
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : cases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <span className="text-neutral-500 py-4">No cases found.</span>
            </Table.Cell>
          </Table.Row>
        ) : (
          cases.map((caseItem) => (
            <Table.Row
              key={caseItem.id}
              clickable={true}
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
                {/*<Badge
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
                </Badge>*/}
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
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
          )}
          {page * CASES_PER_PAGE < totalCases && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page + 1)}
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
