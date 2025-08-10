import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { IconButton } from '../../components/IconButton';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import AdminHeadline from '../../components/AdminHeadline';
import { Table } from '../../components/Table';
import { Avatar } from '../../components/Avatar';
import {
  FeatherSearch,
  FeatherChevronDown,
  FeatherRefreshCw,
  FeatherFilter,
} from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../../helper/formatText';

const DOCTORS_PER_PAGE = 10;

const AdminDoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);

        const searchFilter = search.length >= 3 ? `%${search}%` : null;

        // COUNT
        const { count: total, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'user')
          .ilike('full_name', searchFilter || '%')
          .throwOnError();
        setTotalDoctors(total || 0);
        if (countError) throw countError;

        // PAGE RANGE
        const from = (page - 1) * DOCTORS_PER_PAGE;
        const to = from + DOCTORS_PER_PAGE - 1;

        // DATA with nested cases count if available
        const { data, error } = await supabase
          .from('profiles')
          .select(
            `
            id,
            full_name,
            phone,
            clinic,
            avatar_url,
            cases:cases(count)
          `
          )
          .eq('role', 'user')
          .ilike('full_name', searchFilter || '%')
          .order('full_name', { ascending: true })
          .range(from, to);

        if (error) throw error;

        // Normalize cases count across possible shapes
        const normalized = (data || []).map((d) => ({
          ...d,
          cases_count: Array.isArray(d.cases)
            ? d.cases[0]?.count ?? 0
            : d.cases?.count ?? 0,
        }));

        setDoctors(normalized);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [page, search]);

  useEffect(() => {
    const h = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  return (
    <>
      {error && <Error error={error} />}
      <AdminHeadline>Doctors</AdminHeadline>

      <div className="flex w-full justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-grow max-w-[300px] min-w-[200px]">
            <TextField variant="filled" icon={<FeatherSearch />}>
              <TextField.Input
                placeholder="Search doctor..."
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
              Clinic
            </Button>
            <Button
              size="sm"
              variant="neutral-tertiary"
              iconRight={<FeatherChevronDown />}
            >
              Cases
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
            <Table.HeaderCell>Doctor</Table.HeaderCell>
            <Table.HeaderCell>Phone</Table.HeaderCell>
            <Table.HeaderCell>Clinic</Table.HeaderCell>
            <Table.HeaderCell>Cases</Table.HeaderCell>
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
        ) : doctors.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <span className="text-neutral-500 py-4">No doctors found.</span>
            </Table.Cell>
          </Table.Row>
        ) : (
          doctors.map((doc) => (
            <Table.Row
              key={doc.id}
              clickable
              onClick={() => navigate(`/admin/doctors/${doc.id}`)}
            >
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar size="small" image={doc.avatar_url || undefined} />
                  <span>{capitalizeFirstSafe(doc.full_name) || '-'}</span>
                </div>
              </Table.Cell>
              <Table.Cell>{doc.phone || '-'}</Table.Cell>
              <Table.Cell>{doc.clinic || '-'}</Table.Cell>
              <Table.Cell>{doc.cases_count ?? 0}</Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>

      <div className="flex w-full items-center justify-between">
        <span className="text-body font-body text-subtext-color">
          {totalDoctors === 0
            ? 'No doctors to show'
            : `Showing ${Math.min(
                (page - 1) * DOCTORS_PER_PAGE + 1,
                totalDoctors
              )} - ${Math.min(
                page * DOCTORS_PER_PAGE,
                totalDoctors
              )} of ${totalDoctors} doctors`}
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
          {page * DOCTORS_PER_PAGE < totalDoctors && (
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

export default AdminDoctorsPage;
