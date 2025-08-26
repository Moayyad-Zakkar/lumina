import React from 'react';
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
import { useState, useEffect, useRef } from 'react';
import supabase from '../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../helper/formatText';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import Headline from '../components/Headline';
import { useNavigate } from 'react-router';
import CaseStatusBadge from '../components/CaseStatusBadge';

const CASES_PER_PAGE = 10;

// Available filter options
const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'awaiting_user_approval', label: 'Awaiting Approval' },
  { value: 'user_rejected', label: 'Rejected by Doctor' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const SORT_OPTIONS = [
  {
    value: 'created_at_desc',
    label: 'Newest First',
    column: 'created_at',
    ascending: false,
  },
  {
    value: 'created_at_asc',
    label: 'Oldest First',
    column: 'created_at',
    ascending: true,
  },
  {
    value: 'name_asc',
    label: 'Name A-Z',
    column: 'first_name',
    ascending: true,
  },
  {
    value: 'name_desc',
    label: 'Name Z-A',
    column: 'first_name',
    ascending: false,
  },
  {
    value: 'status_asc',
    label: 'Status A-Z',
    column: 'status',
    ascending: true,
  },
  {
    value: 'status_desc',
    label: 'Status Z-A',
    column: 'status',
    ascending: false,
  },
];

const CasesPage = () => {
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

  const navigate = useNavigate();

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

    switch (range) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return { start: weekStart, end: weekEnd };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 1);
        return { start: quarterStart, end: quarterEnd };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
        return { start: yearStart, end: yearEnd };
      default:
        return null;
    }
  };

  const fetchCases = async (isRefresh = false) => {
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

      let baseQuery = supabase.from('cases').select('*', { count: 'exact' });

      // Apply search filter
      if (search.length >= 3) {
        baseQuery = baseQuery.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }

      // Apply status filter
      if (selectedStatus) {
        baseQuery = baseQuery.eq('status', selectedStatus);
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
      setTotalCases(total);

      // Apply sorting
      const sortOption = SORT_OPTIONS.find((opt) => opt.value === sortBy);
      const sortColumn = sortOption?.column || 'created_at';
      const sortAscending = sortOption?.ascending || false;

      // Fetch paginated cases
      const from = (page - 1) * CASES_PER_PAGE;
      const to = from + CASES_PER_PAGE - 1;
      let query = baseQuery
        .select('*')
        .order(sortColumn, { ascending: sortAscending })
        .range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      setCases(data);

      // Clear any previous errors on successful fetch
      setError(null);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, search, selectedStatus, selectedDateRange, sortBy]);

  // Handle search input and debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatus, selectedDateRange, sortBy]);

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

  const hasActiveFilters =
    selectedStatus ||
    selectedDateRange ||
    search ||
    sortBy !== 'created_at_desc';

  const getStatusLabel = () => {
    if (!selectedStatus) return 'Status';
    const option = STATUS_OPTIONS.find((opt) => opt.value === selectedStatus);
    return option?.label || selectedStatus;
  };

  const getDateLabel = () => {
    if (!selectedDateRange) return 'Date';
    const option = DATE_RANGE_OPTIONS.find(
      (opt) => opt.value === selectedDateRange
    );
    return option?.label || selectedDateRange;
  };

  // Show error at the top, but keep the rest of the page visible
  return (
    <>
      {error && <Error error={error} />}
      <Headline>Cases</Headline>

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
                placeholder="Search cases..."
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
                    onClick={() => {
                      setSelectedStatus('');
                      setShowStatusDropdown(false);
                    }}
                  >
                    All Statuses
                  </button>
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
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
                    onClick={() => {
                      setSelectedDateRange('');
                      setShowDateDropdown(false);
                    }}
                  >
                    All Dates
                  </button>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
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
          {selectedStatus && (
            <Badge variant="neutral" className="text-xs">
              Status: {getStatusLabel()}
              <button
                onClick={() => setSelectedStatus('')}
                className="ml-1 hover:text-neutral-800"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedDateRange && (
            <Badge variant="neutral" className="text-xs">
              Date: {getDateLabel()}
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
          {sortBy !== 'created_at_desc' && (
            <Badge variant="neutral" className="text-xs">
              Sort: {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

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
              <div className="text-center py-8">
                <span className="text-neutral-500">
                  {hasActiveFilters
                    ? 'No cases match your filters.'
                    : 'No cases found.'}
                </span>
                {
                  // Clear filter button under the table when there are no search results
                  /*hasActiveFilters && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="neutral-tertiary"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )*/
                }
              </div>
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
              disabled={loading || refreshing}
            >
              Previous
            </Button>
          )}
          {page * CASES_PER_PAGE < totalCases && (
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

export default CasesPage;
