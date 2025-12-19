import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { IconButton } from '../../components/IconButton';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import Headline from '../../components/Headline';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import {
  FeatherSearch,
  FeatherChevronDown,
  FeatherChevronUp,
  FeatherRefreshCw,
  FeatherArrowDownUp,
  FeatherX,
} from '@subframe/core';
import CaseStatusBadge from '../../components/CaseStatusBadge';

import supabase from '../../../helper/supabaseClient';
import {
  capitalizeFirst,
  capitalizeFirstSafe,
} from '../../../helper/formatText';
import { Avatar } from '../../components/Avatar';
import AdminHeadline from '../../components/AdminHeadline';

const CASES_PER_PAGE = 10;

const getStatusOptions = (t) => [
  { value: 'submitted', label: t('cases.filters.submitted') },
  { value: 'rejected', label: t('cases.filters.rejected') },
  {
    value: 'awaiting_user_approval',
    label: t('cases.filters.awaitingApproval'),
  },
  { value: 'user_rejected', label: t('cases.filters.rejectedByDoctor') },
  { value: 'approved', label: t('cases.filters.approved') },
  { value: 'in_production', label: t('cases.filters.inProduction') },
  { value: 'ready_for_delivery', label: t('cases.filters.readyForDelivery') },
  { value: 'delivered', label: t('cases.filters.delivered') },
  { value: 'completed', label: t('cases.filters.completed') },
];

const getDateRangeOptions = (t) => [
  { value: 'today', label: t('cases.filters.today') },
  { value: 'week', label: t('cases.filters.thisWeek') },
  { value: 'month', label: t('cases.filters.thisMonth') },
  { value: 'quarter', label: t('cases.filters.thisQuarter') },
  { value: 'year', label: t('cases.filters.thisYear') },
];

const getSortOptions = (t) => [
  {
    value: 'created_at_desc',
    label: t('cases.filters.newestFirst'),
    column: 'created_at',
    ascending: false,
  },
  {
    value: 'created_at_asc',
    label: t('cases.filters.oldestFirst'),
    column: 'created_at',
    ascending: true,
  },
  {
    value: 'patient_name_asc',
    label: t('cases.filters.patientAZ'),
    column: 'first_name',
    ascending: true,
  },
  {
    value: 'patient_name_desc',
    label: t('cases.filters.patientZA'),
    column: 'first_name',
    ascending: false,
  },
  {
    value: 'doctor_name_asc',
    label: t('cases.filters.doctorAZ'),
    column: 'profiles(full_name)',
    ascending: true,
  },
  {
    value: 'doctor_name_desc',
    label: t('cases.filters.doctorZA'),
    column: 'profiles(full_name)',
    ascending: false,
  },
  {
    value: 'status_asc',
    label: t('cases.filters.statusAZ'),
    column: 'status',
    ascending: true,
  },
  {
    value: 'status_desc',
    label: t('cases.filters.statusZA'),
    column: 'status',
    ascending: false,
  },
];

const AdminCasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [alignerMaterialOptions, setAlignerMaterialOptions] = useState([]);
  const { t } = useTranslation();
  const statusOptions = useMemo(() => getStatusOptions(t), [t]);
  const dateRangeOptions = useMemo(() => getDateRangeOptions(t), [t]);
  const sortOptions = useMemo(() => getSortOptions(t), [t]);
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAlignerMaterial, setSelectedAlignerMaterial] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAlignerMaterialDropdown, setShowAlignerMaterialDropdown] =
    useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Refs for dropdown handling
  const statusDropdownRef = useRef(null);
  const alignerMaterialDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const filterPanelRef = useRef(null);

  const navigate = useNavigate();

  // Fetch aligner materials from services table
  useEffect(() => {
    const fetchAlignerMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('name')
          .eq('type', 'aligners_material')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        // Convert to simple array of { value, label } objects
        const options = (data || []).map((item) => ({
          value: item.name,
          label: item.name,
        }));

        setAlignerMaterialOptions(options);
      } catch (error) {
        console.error('Error fetching aligner materials:', error);
      }
    };

    fetchAlignerMaterials();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        alignerMaterialDropdownRef.current &&
        !alignerMaterialDropdownRef.current.contains(event.target)
      ) {
        setShowAlignerMaterialDropdown(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setShowDateDropdown(false);
      }
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target)
      ) {
        setShowFilterPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get date range for filtering
  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    const weekEnd = new Date(weekStart);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const quarter = Math.floor(today.getMonth() / 3);
    const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear() + 1, 0, 1);

    switch (range) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case 'week':
        weekStart.setDate(today.getDate() - today.getDay());
        weekEnd.setDate(weekStart.getDate() + 7);
        return { start: weekStart, end: weekEnd };
      case 'month':
        return { start: monthStart, end: monthEnd };
      case 'quarter':
        return { start: quarterStart, end: quarterEnd };
      case 'year':
        return { start: yearStart, end: yearEnd };
      default:
        return null;
    }
  };

  const fetchCases = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        let baseQuery = supabase.from('cases').select(
          `
            *,
            profiles (
              id,
              full_name,
              phone,
              clinic,
              avatar_url
            )
          `,
          { count: 'exact' }
        );

        // Apply search filter
        if (search.length >= 3) {
          baseQuery = baseQuery.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
          );
        }

        // Apply status filter
        if (selectedStatus) {
          baseQuery = baseQuery.eq('status', selectedStatus);
        }

        // Apply aligner material filter (string comparison)
        if (selectedAlignerMaterial) {
          baseQuery = baseQuery.eq('aligner_material', selectedAlignerMaterial);
        }

        // Apply date range filter
        if (selectedDateRange) {
          const dateRange = getDateRange(selectedDateRange);
          if (dateRange) {
            baseQuery = baseQuery
              .gte('created_at', dateRange.start.toISOString())
              .lt('created_at', dateRange.end.toISOString());
          }
        }

        // Get total count
        const { count: total, error: countError } = await baseQuery;
        if (countError) throw countError;
        setTotalCases(total || 0);

        // Apply sorting
        const sortOption = sortOptions.find((opt) => opt.value === sortBy);
        const sortColumn = sortOption?.column || 'created_at';
        const sortAscending = sortOption?.ascending || false;

        // For doctor name sorting, we need to handle it differently
        let sortedQuery = baseQuery.select(
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
        );

        if (sortColumn.includes('profiles')) {
          // For profile-related sorting, we'll sort on the client side after fetching
          sortedQuery = sortedQuery.order('created_at', { ascending: false });
        } else {
          sortedQuery = sortedQuery.order(sortColumn, {
            ascending: sortAscending,
          });
        }

        // Fetch paginated cases
        const from = (page - 1) * CASES_PER_PAGE;
        const to = from + CASES_PER_PAGE - 1;
        const { data, error } = await sortedQuery.range(from, to);

        if (error) throw error;

        let processedData = (data || []).map((c) => ({
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

        // Client-side sorting for profile-related fields
        if (sortColumn.includes('profiles')) {
          processedData.sort((a, b) => {
            const aValue = a.profiles?.full_name || '';
            const bValue = b.profiles?.full_name || '';
            const comparison = aValue.localeCompare(bValue);
            return sortAscending ? comparison : -comparison;
          });
        }

        setCases(processedData);

        // Clear any previous errors on successful fetch
        setError(null);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError(error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      selectedStatus,
      selectedAlignerMaterial,
      selectedDateRange,
      sortBy,
      sortOptions,
    ]
  );

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Handle search input and debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatus, selectedAlignerMaterial, selectedDateRange, sortBy]);

  const handleRefresh = () => {
    fetchCases(true);
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedAlignerMaterial('');
    setSelectedDateRange('');
    setSortBy('created_at_desc');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters =
    selectedStatus ||
    selectedAlignerMaterial ||
    selectedDateRange ||
    search ||
    sortBy !== 'created_at_desc';

  const getStatusLabel = () => {
    if (!selectedStatus) return t('cases.filters.status');
    const option = statusOptions.find((opt) => opt.value === selectedStatus);
    return option?.label || selectedStatus;
  };

  const getAlignerMaterialLabel = () => {
    if (!selectedAlignerMaterial) return t('cases.filters.material');
    const material = alignerMaterialOptions.find(
      (m) => m.value === selectedAlignerMaterial
    );
    return material?.label || selectedAlignerMaterial;
  };

  const getDateLabel = () => {
    if (!selectedDateRange) return t('cases.filters.date');
    const option = dateRangeOptions.find(
      (opt) => opt.value === selectedDateRange
    );
    return option?.label || selectedDateRange;
  };

  return (
    <>
      {error && <Error error={error} />}
      <AdminHeadline submit={true}>{t('navigation.allCases')}</AdminHeadline>

      <div className="flex w-full justify-between items-center gap-4">
        {/* Left Side: Search + Filters */}
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
                placeholder={t('cases.searchPatientOrDoctor')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </TextField>
          </div>

          {/* Status Filter */}
          <div className="flex-shrink-0 relative" ref={statusDropdownRef}>
            <Button
              size="sm"
              variant={
                selectedStatus ? 'neutral-secondary' : 'neutral-tertiary'
              }
              className="px-3"
              iconRight={
                showStatusDropdown ? (
                  <FeatherChevronUp />
                ) : (
                  <FeatherChevronDown />
                )
              }
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowAlignerMaterialDropdown(false);
                setShowDateDropdown(false);
              }}
            >
              {getStatusLabel()}
            </Button>

            {showStatusDropdown && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[160px]"
                dir="rtl" // Add dir="rtl" for proper flow context
              >
                <div className="py-1">
                  <button
                    // FIX: Changed text-left to text-right
                    className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => {
                      setSelectedStatus('');
                      setShowStatusDropdown(false);
                    }}
                  >
                    {t('cases.filters.allStatuses')}
                  </button>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      // FIX: Changed text-left to text-right
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedStatus === option.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aligner Material Filter */}
          <div
            className="flex-shrink-0 relative"
            ref={alignerMaterialDropdownRef}
          >
            <Button
              size="sm"
              variant={
                selectedAlignerMaterial
                  ? 'neutral-secondary'
                  : 'neutral-tertiary'
              }
              className="px-3"
              iconRight={
                showAlignerMaterialDropdown ? (
                  <FeatherChevronUp />
                ) : (
                  <FeatherChevronDown />
                )
              }
              onClick={() => {
                setShowAlignerMaterialDropdown(!showAlignerMaterialDropdown);
                setShowStatusDropdown(false);
                setShowDateDropdown(false);
              }}
            >
              {getAlignerMaterialLabel()}
            </Button>

            {showAlignerMaterialDropdown && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[140px] max-h-[300px] overflow-y-auto"
                dir="rtl" // Add dir="rtl" for proper flow context
              >
                <div className="py-1">
                  <button
                    // FIX: Changed text-left to text-right
                    className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => {
                      setSelectedAlignerMaterial('');
                      setShowAlignerMaterialDropdown(false);
                    }}
                  >
                    {t('cases.filters.allMaterials')}
                  </button>
                  {alignerMaterialOptions.map((material) => (
                    <button
                      key={material.value}
                      // FIX: Changed text-left to text-right
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedAlignerMaterial === material.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => {
                        setSelectedAlignerMaterial(material.value);
                        setShowAlignerMaterialDropdown(false);
                      }}
                    >
                      {material.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex-shrink-0 relative" ref={dateDropdownRef}>
            <Button
              size="sm"
              variant={
                selectedDateRange ? 'neutral-secondary' : 'neutral-tertiary'
              }
              className="px-3"
              iconRight={
                showDateDropdown ? <FeatherChevronUp /> : <FeatherChevronDown />
              }
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowStatusDropdown(false);
                setShowAlignerMaterialDropdown(false);
              }}
            >
              {getDateLabel()}
            </Button>

            {showDateDropdown && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[140px]"
                dir="rtl"
              >
                <div className="py-1">
                  <button
                    className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => {
                      setSelectedDateRange('');
                      setShowDateDropdown(false);
                    }}
                  >
                    {t('cases.filters.allDates')}
                  </button>

                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedDateRange === option.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => {
                        setSelectedDateRange(option.value);
                        setShowDateDropdown(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="neutral-tertiary"
              className="px-2 w-auto"
              onClick={clearFilters}
              icon={<FeatherX />}
            >
              {t('cases.filters.clearFilters')}
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

          {/* Advanced Filter Panel Toggle */}
          <div className="relative" ref={filterPanelRef}>
            <IconButton
              icon={<FeatherArrowDownUp />}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            />

            {showFilterPanel && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[200px]"
                dir="rtl" // Sets the overall directionality for padding/flow
              >
                <div className="p-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3 text-right">
                    {t('cases.filters.sortBy')}
                  </h3>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <label
                        key={option.value}
                        // FIX: justify-start pushes content to the right edge in RTL.
                        className="flex items-center justify-start"
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
                          // FIX: order-1 places the radio button on the far right.
                          // FIX: ml-2 creates space between the button and the text.
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
          {selectedStatus && (
            <Badge variant="neutral" className="text-xs">
              {t('cases.filters.status')}: {getStatusLabel()}
              <button
                onClick={() => setSelectedStatus('')}
                className="ml-1 hover:text-neutral-800"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedAlignerMaterial && (
            <Badge variant="neutral" className="text-xs">
              {t('cases.filters.material')}: {getAlignerMaterialLabel()}
              <button
                onClick={() => setSelectedAlignerMaterial('')}
                className="ml-1 hover:text-neutral-800"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedDateRange && (
            <Badge variant="neutral" className="text-xs">
              {t('cases.filters.date')}: {getDateLabel()}
              <button
                onClick={() => setSelectedDateRange('')}
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
          {sortBy !== 'created_at_desc' && (
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

      <div className="flex w-full items-center justify-between">
        <span className="text-body font-body text-subtext-color">
          {totalCases === 0
            ? t('casesPage.noCasesToShow')
            : `${t('cases.showing')} ${Math.min(
                (page - 1) * CASES_PER_PAGE + 1,
                totalCases
              )} - ${Math.min(page * CASES_PER_PAGE, totalCases)} ${t(
                'cases.of'
              )} ${totalCases} ${t('cases.cases')}`}
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
          {page * CASES_PER_PAGE < totalCases && (
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

export default AdminCasesPage;
