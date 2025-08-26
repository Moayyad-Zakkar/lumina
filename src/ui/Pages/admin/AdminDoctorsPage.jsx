import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { IconButton } from '../../components/IconButton';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import AdminHeadline from '../../components/AdminHeadline';
import { Table } from '../../components/Table';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import {
  FeatherSearch,
  FeatherChevronDown,
  FeatherChevronUp,
  FeatherRefreshCw,
  FeatherArrowDownUp,
  FeatherX,
} from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../../helper/formatText';

const DOCTORS_PER_PAGE = 10;

const SORT_OPTIONS = [
  {
    value: 'name_asc',
    label: 'Name A-Z',
    column: 'full_name',
    ascending: true,
  },
  {
    value: 'name_desc',
    label: 'Name Z-A',
    column: 'full_name',
    ascending: false,
  },
  {
    value: 'clinic_asc',
    label: 'Clinic A-Z',
    column: 'clinic',
    ascending: true,
  },
  {
    value: 'clinic_desc',
    label: 'Clinic Z-A',
    column: 'clinic',
    ascending: false,
  },
  {
    value: 'cases_desc',
    label: 'Most Cases First',
    column: 'cases_count',
    ascending: false,
  },
  {
    value: 'cases_asc',
    label: 'Fewest Cases First',
    column: 'cases_count',
    ascending: true,
  },
];

const AdminDoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Filter states
  const [selectedClinic, setSelectedClinic] = useState('');
  const [clinicOptions, setClinicOptions] = useState([]);
  const [sortBy, setSortBy] = useState('name_asc');
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // Refs for dropdown handling
  const clinicDropdownRef = useRef(null);
  const sortPanelRef = useRef(null);

  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clinicDropdownRef.current &&
        !clinicDropdownRef.current.contains(event.target)
      ) {
        setShowClinicDropdown(false);
      }
      if (
        sortPanelRef.current &&
        !sortPanelRef.current.contains(event.target)
      ) {
        setShowSortPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unique clinics for filter options
  useEffect(() => {
    const fetchClinicOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('clinic')
          .eq('role', 'user')
          .not('clinic', 'is', null)
          .not('clinic', 'eq', '');

        if (error) throw error;

        const uniqueClinics = [...new Set(data.map((d) => d.clinic))].sort();
        setClinicOptions(
          uniqueClinics.map((clinic) => ({ value: clinic, label: clinic }))
        );
      } catch (error) {
        console.error('Error fetching clinic options:', error);
      }
    };

    fetchClinicOptions();
  }, []);

  const fetchDoctors = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let baseQuery = supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          phone,
          clinic,
          avatar_url,
          cases:cases(count)
        `,
          { count: 'exact' }
        )
        .eq('role', 'user');

      // Apply search filter
      if (search.length >= 3) {
        baseQuery = baseQuery.ilike('full_name', `%${search}%`);
      }

      // Apply clinic filter
      if (selectedClinic) {
        baseQuery = baseQuery.eq('clinic', selectedClinic);
      }

      // Get total count
      const { count: total, error: countError } = await baseQuery;
      if (countError) throw countError;
      setTotalDoctors(total || 0);

      // Apply sorting
      const sortOption = SORT_OPTIONS.find((opt) => opt.value === sortBy);
      const sortColumn = sortOption?.column || 'full_name';
      const sortAscending = sortOption?.ascending !== false;

      // Fetch paginated doctors
      const from = (page - 1) * DOCTORS_PER_PAGE;
      const to = from + DOCTORS_PER_PAGE - 1;

      let sortedQuery = baseQuery.select(
        `
        id,
        full_name,
        phone,
        clinic,
        avatar_url,
        cases:cases(count)
      `
      );

      // For cases count sorting, we need to handle it on client side after getting the data
      if (sortColumn === 'cases_count') {
        sortedQuery = sortedQuery.order('full_name', { ascending: true });
      } else {
        sortedQuery = sortedQuery.order(sortColumn, {
          ascending: sortAscending,
        });
      }

      const { data, error } = await sortedQuery.range(from, to);

      if (error) throw error;

      // Normalize cases count across possible shapes
      let normalized = (data || []).map((d) => ({
        ...d,
        cases_count: Array.isArray(d.cases)
          ? d.cases[0]?.count ?? 0
          : d.cases?.count ?? 0,
      }));

      // Client-side sorting for cases count
      if (sortColumn === 'cases_count') {
        normalized.sort((a, b) => {
          const comparison = a.cases_count - b.cases_count;
          return sortAscending ? comparison : -comparison;
        });
      }

      setDoctors(normalized);

      // Clear any previous errors on successful fetch
      setError(null);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, search, selectedClinic, sortBy]);

  // Handle search input and debounce
  useEffect(() => {
    const h = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedClinic, sortBy]);

  const handleRefresh = () => {
    fetchDoctors(true);
  };

  const clearFilters = () => {
    setSelectedClinic('');
    setSortBy('name_asc');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = selectedClinic || search || sortBy !== 'name_asc';

  const getClinicLabel = () => {
    if (!selectedClinic) return 'Clinic';
    return selectedClinic;
  };

  return (
    <>
      {error && <Error error={error} />}
      <AdminHeadline>Doctors</AdminHeadline>

      <div className="flex w-full justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Bar */}
          <div className="flex-grow max-w-[300px] min-w-[200px]">
            <TextField
              className="w-full"
              variant="filled"
              label=""
              helpText=""
              icon={<FeatherSearch />}
            >
              <TextField.Input
                placeholder="Search doctor..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </TextField>
          </div>

          {/* Clinic Filter */}
          <div className="flex-shrink-0 relative" ref={clinicDropdownRef}>
            <Button
              size="sm"
              variant={
                selectedClinic ? 'neutral-secondary' : 'neutral-tertiary'
              }
              className="px-3"
              iconRight={
                showClinicDropdown ? (
                  <FeatherChevronUp />
                ) : (
                  <FeatherChevronDown />
                )
              }
              onClick={() => {
                setShowClinicDropdown(!showClinicDropdown);
                setShowSortPanel(false);
              }}
            >
              {getClinicLabel()}
            </Button>

            {showClinicDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[160px] max-h-64 overflow-y-auto">
                <div className="py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => {
                      setSelectedClinic('');
                      setShowClinicDropdown(false);
                    }}
                  >
                    All Clinics
                  </button>
                  {clinicOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedClinic === option.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => {
                        setSelectedClinic(option.value);
                        setShowClinicDropdown(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cases Filter - Commented out as requested */}
          {/*
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="neutral-tertiary"
              iconRight={<FeatherChevronDown />}
            >
              Cases
            </Button>
          </div>
          */}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="neutral-tertiary"
              className="px-2 w-auto"
              onClick={clearFilters}
              icon={<FeatherX />}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <IconButton
            icon={
              <FeatherRefreshCw className={refreshing ? 'animate-spin' : ''} />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          />

          {/* Sort Panel Toggle */}
          <div className="relative" ref={sortPanelRef}>
            <IconButton
              icon={<FeatherArrowDownUp />}
              onClick={() => {
                setShowSortPanel(!showSortPanel);
                setShowClinicDropdown(false);
              }}
            />

            {showSortPanel && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    Sort By
                  </h3>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="sort"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-neutral-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-neutral-600">Active filters:</span>
          {selectedClinic && (
            <Badge variant="neutral" className="text-xs">
              Clinic: {selectedClinic}
              <button
                onClick={() => setSelectedClinic('')}
                className="ml-1 hover:text-neutral-800"
              >
                ×
              </button>
            </Badge>
          )}
          {search && (
            <Badge variant="neutral" className="text-xs">
              Search: "{search}"
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="ml-1 hover:text-neutral-800"
              >
                ×
              </button>
            </Badge>
          )}
          {sortBy !== 'name_asc' && (
            <Badge variant="neutral" className="text-xs">
              Sort: {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

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
              <div className="text-center py-8">
                <span className="text-neutral-500">
                  {hasActiveFilters
                    ? 'No doctors match your filters.'
                    : 'No doctors found.'}
                </span>
              </div>
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
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    {capitalizeFirstSafe(doc.full_name) || '-'}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {doc.phone || '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {doc.clinic || '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-700">
                  {doc.cases_count ?? 0}
                </span>
              </Table.Cell>
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
              disabled={loading || refreshing}
            >
              Previous
            </Button>
          )}
          {page * DOCTORS_PER_PAGE < totalDoctors && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page + 1)}
              disabled={loading || refreshing}
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
