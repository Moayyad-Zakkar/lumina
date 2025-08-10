import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { IconButton } from '../../components/IconButton';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import Headline from '../../components/Headline';
import { Table } from '../../components/Table';
import {
  FeatherSearch,
  FeatherChevronDown,
  FeatherRefreshCw,
  FeatherFilter,
} from '@subframe/core';
import CaseStatusBadge from '../../components/CaseStatusBadge';

import supabase from '../../../helper/supabaseClient';
import { capitalizeFirst } from '../../../helper/formatText';
import { Avatar } from '../../components/Avatar';

const CASES_PER_PAGE = 10;

const AdminCasesPage = () => {
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

        // ---- Build search condition
        const searchFilter =
          search.length >= 3
            ? { key: 'first_name', value: `%${search}%` }
            : null;

        // ---- COUNT query
        const { count: total, error: countError } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .ilike(searchFilter?.key || 'first_name', searchFilter?.value || '%')
          .throwOnError();

        setTotalCases(total || 0);
        if (countError) throw countError;

        // ---- PAGINATED query with JOIN
        const from = (page - 1) * CASES_PER_PAGE;
        const to = from + CASES_PER_PAGE - 1;

        /*
        const { data, error } = await supabase
          .from('cases')
          .select(
            `
    *,
    profiles (
      id,
      full_name,
      phone,
      clinic,
      avatar_url
    )
  `
          )
          .ilike(searchFilter?.key || 'first_name', searchFilter?.value || '%')
          .order('created_at', { ascending: false })
          .range(from, to);

          */

        const { data, error } = await supabase
          .from('cases')
          .select(
            `
    *,
    profiles (
      id,
      full_name,
      phone,
      clinic,
      avatar_url
    )
  `
          )
          .order('created_at', {
            ascending: false,
          })
          .range(from, to);

        console.log('Raw Query Data:', data);
        console.log('Query Error:', error);
        if (error) throw error;
        const normalized = (data || []).map((c) => ({
          ...c,
          first_name: capitalizeFirst(c.first_name),
          last_name: capitalizeFirst(c.last_name),
          profiles: c.profiles
            ? {
                ...c.profiles,
                full_name: capitalizeFirst(c.profiles.full_name),
              }
            : c.profiles,
        }));

        setCases(normalized);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [page, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  console.log(cases[0]);
  return (
    <>
      {error && <Error error={error} />}
      <Headline>All Cases</Headline>

      <div className="flex w-full justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-grow max-w-[300px] min-w-[200px]">
            <TextField variant="filled" icon={<FeatherSearch />}>
              <TextField.Input
                placeholder="Search patient..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </TextField>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <Button
              size="sm"
              variant="neutral-tertiary"
              iconRight={<FeatherChevronDown />}
            >
              Status
            </Button>
            <Button
              size="sm"
              variant="neutral-tertiary"
              iconRight={<FeatherChevronDown />}
            >
              Date
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <IconButton icon={<FeatherRefreshCw />} />
          <IconButton icon={<FeatherFilter />} />
        </div>
      </div>

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>Patient</Table.HeaderCell>
            <Table.HeaderCell>Doctor</Table.HeaderCell>
            <Table.HeaderCell>Clinic</Table.HeaderCell>
            <Table.HeaderCell>Phone</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Submitted</Table.HeaderCell>
            <Table.HeaderCell>Case ID</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <div className="flex w-full h-full min-h-[100px] justify-center items-center">
                <Loader size="medium" />
              </div>
            </Table.Cell>
          </Table.Row>
        ) : cases.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={7}>
              <span className="text-neutral-500 py-4">No cases found.</span>
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
                {caseItem.first_name} {caseItem.last_name}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="small"
                    image={caseItem.profiles?.avatar_url || undefined}
                  />
                  <span>{caseItem.profiles?.full_name || '-'}</span>
                </div>
              </Table.Cell>
              <Table.Cell>{caseItem.profiles?.clinic || '-'}</Table.Cell>
              <Table.Cell>{caseItem.profiles?.phone || '-'}</Table.Cell>
              <Table.Cell>
                <CaseStatusBadge status={caseItem.status} />
              </Table.Cell>
              <Table.Cell>
                {caseItem.created_at
                  ? new Date(caseItem.created_at).toLocaleDateString()
                  : '-'}
              </Table.Cell>
              <Table.Cell>
                {caseItem.id ? `CASE-${caseItem.id}` : '-'}
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

export default AdminCasesPage;
