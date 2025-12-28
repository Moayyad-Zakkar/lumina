import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { FeatherArrowDownUp, FeatherSearch } from '@subframe/core';
import { FeatherChevronDown } from '@subframe/core';
import { FeatherChevronUp } from '@subframe/core';
import { IconButton } from '../components/IconButton';
import { FeatherRefreshCw } from '@subframe/core';
import { FeatherX } from '@subframe/core';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import Headline from '../components/Headline';
import { useNavigate } from 'react-router';
import CaseStatusBadge from '../components/CaseStatusBadge';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileCasesList from '../components/MobileDoctorCasesList';
import DesktopCasesTable from '../components/DesktopCasesTable';

const CASES_PER_PAGE = 10;

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
    value: 'name_asc',
    label: t('cases.filters.patientAZ'),
    column: 'first_name',
    ascending: true,
  },
  {
    value: 'name_desc',
    label: t('cases.filters.patientZA'),
    column: 'first_name',
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

const CasesPage = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Filter options using translations
  const STATUS_OPTIONS = [
    { value: 'submitted', label: t('cases.filters.submitted') },
    { value: 'accepted', label: t('caseStatusBadge.accepted') },
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

  const DATE_RANGE_OPTIONS = [
    { value: 'today', label: t('cases.filters.today') },
    { value: 'week', label: t('cases.filters.thisWeek') },
    { value: 'month', label: t('cases.filters.thisMonth') },
    { value: 'quarter', label: t('cases.filters.thisQuarter') },
    { value: 'year', label: t('cases.filters.thisYear') },
  ];

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Refs for dropdown handling
  const statusDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const filterPanelRef = useRef(null);

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

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const sortOption = getSortOptions(t).find(
          (opt) => opt.value === sortBy
        );
        const sortColumn = sortOption?.column || 'created_at';
        const sortAscending = sortOption?.ascending || false;

        const from = (page - 1) * CASES_PER_PAGE;
        const to = from + CASES_PER_PAGE - 1;

        let query = supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortAscending })
          .range(from, to);

        if (search.length >= 3) {
          query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
          );
        }

        if (selectedStatus) {
          query = query.eq('status', selectedStatus);
        }

        if (selectedDateRange) {
          const dateRange = getDateRange(selectedDateRange);
          if (dateRange) {
            query = query
              .gte('created_at', dateRange.start.toISOString())
              .lt('created_at', dateRange.end.toISOString());
          }
        }

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        setCases(data || []);
        setTotalCases(count || 0);
        setError(null);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError(error.message || 'Failed to fetch cases');
        setCases([]);
        setTotalCases(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, selectedStatus, selectedDateRange, sortBy, t]
  );

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput.trim() !== search) {
        setPage(1);
        setSearch(searchInput.trim());
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, search]);

  const handleRefresh = () => {
    fetchCases(true);
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedDateRange('');
    setSortBy('created_at_desc');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPage(1);
    setShowStatusDropdown(false);
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    setPage(1);
    setShowDateDropdown(false);
  };

  const handleSortChange = (sortValue) => {
    setSortBy(sortValue);
    setPage(1);
  };

  const hasActiveFilters =
    selectedStatus ||
    selectedDateRange ||
    search ||
    sortBy !== 'created_at_desc';

  const getStatusLabel = () => {
    if (!selectedStatus) return t('cases.filters.status');
    const option = STATUS_OPTIONS.find((opt) => opt.value === selectedStatus);
    return option?.label || selectedStatus;
  };

  const getDateLabel = () => {
    if (!selectedDateRange) return t('cases.filters.date');
    const option = DATE_RANGE_OPTIONS.find(
      (opt) => opt.value === selectedDateRange
    );
    return option?.label || selectedDateRange;
  };

  return (
    <>
      {error && <Error error={error} />}
      <Headline>{t('cases.title')}</Headline>

      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left Side: Search + Filters */}
        <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-1 scrollbar-hide">
          {/* Search Bar */}
          <div className="w-full md:flex-grow md:max-w-[300px] md:min-w-[200px]">
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
                setShowDateDropdown(false);
              }}
            >
              {getStatusLabel()}
            </Button>

            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[160px]">
                <div className="py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => handleStatusChange('')}
                  >
                    {t('cases.filters.allStatuses')}
                  </button>
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedStatus === option.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => handleStatusChange(option.value)}
                    >
                      {option.label}
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
              }}
            >
              {getDateLabel()}
            </Button>

            {showDateDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[140px]">
                <div className="py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
                    onClick={() => handleDateRangeChange('')}
                  >
                    {t('cases.filters.allDates')}
                  </button>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                        selectedDateRange === option.value
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                      onClick={() => handleDateRangeChange(option.value)}
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
              <span className="hidden md:inline">
                {t('cases.filters.clearFilters')}
              </span>
            </Button>
          )}
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
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
              <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-border rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    {t('cases.filters.sortBy')}
                  </h3>
                  <div className="space-y-2">
                    {getSortOptions(t).map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="sort"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => handleSortChange(e.target.value)}
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
          <span className="text-xs text-neutral-600">
            {t('cases.filters.activeFilters')}
          </span>
          {selectedStatus && (
            <Badge variant="neutral" className="text-xs">
              {t('cases.filters.status')}: {getStatusLabel()}
              <button
                onClick={() => {
                  setSelectedStatus('');
                  setPage(1);
                }}
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
                onClick={() => {
                  setSelectedDateRange('');
                  setPage(1);
                }}
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
                  setPage(1);
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
              {getSortOptions(t).find((opt) => opt.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

      {isMobile ? (
        <MobileCasesList cases={cases} loading={loading} />
      ) : (
        <DesktopCasesTable cases={cases} loading={loading} />
      )}

      <div className="flex w-full items-center justify-between">
        <span className="text-body font-body text-subtext-color">
          {totalCases === 0
            ? t('casesPage.noCasesToShow')
            : t('cases.showing') +
              ' ' +
              Math.min((page - 1) * CASES_PER_PAGE + 1, totalCases) +
              ' - ' +
              Math.min(page * CASES_PER_PAGE, totalCases) +
              ' ' +
              t('cases.of') +
              ' ' +
              totalCases +
              ' ' +
              t('cases.cases')}
        </span>
        <div className="flex gap-2 w-full md:w-auto">
          {page > 1 && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page - 1)}
              disabled={loading || refreshing}
              className="flex-1 md:flex-none"
            >
              {t('common.previous')}
            </Button>
          )}
          {page * CASES_PER_PAGE < totalCases && (
            <Button
              variant="neutral-secondary"
              onClick={() => setPage(page + 1)}
              disabled={loading || refreshing}
              className="flex-1 md:flex-none"
            >
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CasesPage;
