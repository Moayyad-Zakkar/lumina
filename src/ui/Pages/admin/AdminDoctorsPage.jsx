import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

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

const getSortOptions = (t) => [
  {
    value: 'name_asc',
    // Reuse doctor A-Z label from cases filters
    label: t('cases.filters.doctorAZ'),
    column: 'full_name',
    ascending: true,
  },
  {
    value: 'name_desc',
    // Reuse doctor Z-A label from cases filters
    label: t('cases.filters.doctorZA'),
    column: 'full_name',
    ascending: false,
  },
  {
    value: 'clinic_asc',

    label: t('cases.filters.clinicAZ'),
    column: 'clinic',
    ascending: true,
  },
  {
    value: 'clinic_desc',
    label: t('cases.filters.clinicZA'),
    column: 'clinic',
    ascending: false,
  },
  {
    value: 'cases_desc',
    label: t('cases.filters.mostCasesFirst'),
    column: 'cases_count',
    ascending: false,
  },
  {
    value: 'cases_asc',
    label: t('cases.filters.fewestCasesFirst'),
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

  const { t } = useTranslation();
  const sortOptions = useMemo(() => getSortOptions(t), [t]);

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
      const sortOption = sortOptions.find((opt) => opt.value === sortBy);
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
    if (!selectedClinic) return t('cases.filters.clinic');
    return selectedClinic;
  };

  return (
    <>
      {error && <Error error={error} />}
      <AdminHeadline>{t('navigation.doctors')}</AdminHeadline>

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
                placeholder={t('billing.searchDoctors')}
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
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[160px] max-h-64 overflow-y-auto"
                dir="rtl" // Add dir="rtl" for proper flow context
              >
                <div className="py-1">
                  <button
                    // FIX: Changed text-left to text-right
                    className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => {
                      setSelectedClinic('');
                      setShowClinicDropdown(false);
                    }}
                  >
                    {t('cases.filters.allClinics')}
                  </button>
                  {clinicOptions.map((option) => (
                    <button
                      key={option.value}
                      // FIX: Changed text-left to text-right
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 ${
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

          {/* Cases Filter */}
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
              {t('common.clear')}
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
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3 text-right">
                    {t('cases.filters.sortBy')}
                  </h3>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <label
                        key={option.value}
                        // Alignment is fixed here: justify-start pushes content to the right in RTL.
                        className="flex items-center justify-start"
                        dir="rtl"
                      >
                        {/* Text is visually on the left (order-2) */}
                        <span className="text-sm text-neutral-700 order-2">
                          {option.label}
                        </span>
                        <input
                          type="radio"
                          name="sort"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value)}
                          // Radio is visually on the right (order-1). ml-2 provides correct spacing.
                          className="ml-2 order-1"
                        />
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
          <span className="text-xs text-neutral-600">
            {t('cases.filters.activeFilters')}
          </span>
          {selectedClinic && (
            <Badge variant="neutral" className="text-xs">
              {t('cases.clinic')}: {selectedClinic}
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
              {t('common.search')}: "{search}"
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
              {t('cases.filters.sortBy')}:{' '}
              {sortOptions.find((opt) => opt.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell>{t('cases.doctor')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.phone')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.clinic')}</Table.HeaderCell>
            <Table.HeaderCell>{t('cases.cases')}</Table.HeaderCell>
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
                    ? t('cases.noMatchingCases')
                    : t('cases.noCases')}
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
                  <Avatar size="small" image={doc.avatar_url || undefined}>
                    {!doc.avatar_url && (
                      <>
                        {capitalizeFirstSafe(doc.full_name?.split(' ')[0]?.[0])}
                        {capitalizeFirstSafe(
                          doc.full_name?.split(' ').slice(-1)[0]?.[0]
                        )}
                      </>
                    )}
                  </Avatar>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    {capitalizeFirstSafe(doc.full_name) || '-'}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span
                  dir="ltr"
                  className="whitespace-nowrap text-body font-body text-neutral-500"
                >
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
            ? t('casesPage.noCasesToShow')
            : `${t('cases.showing')} ${Math.min(
                (page - 1) * DOCTORS_PER_PAGE + 1,
                totalDoctors
              )} - ${Math.min(page * DOCTORS_PER_PAGE, totalDoctors)} ${t(
                'cases.of'
              )} ${totalDoctors} ${t('navigation.doctors')}`}
        </span>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page - 1)}
              disabled={loading || refreshing}
            >
              {t('common.previous')}
            </Button>
          )}
          {page * DOCTORS_PER_PAGE < totalDoctors && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page + 1)}
              disabled={loading || refreshing}
            >
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDoctorsPage;
