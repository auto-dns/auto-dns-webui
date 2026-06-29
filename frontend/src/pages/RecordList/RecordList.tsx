import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Filters, SortState, RecordEntry } from '../../types';
import { deriveFilterOptions } from '../../utils/filters';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterSortDrawer from '../../components/FilterSortDrawer/FilterSortDrawer';
import RecordGrid from '../../components/RecordGrid/RecordGrid';
import RecordModal from '../../components/RecordModal/RecordModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import { SORT_KEYS, sortRecords } from '../../utils/sort';
import { enrichSearchable } from '../../utils/record';
import { filterRecords, getFacetCounts, countActiveFilters } from '../../utils/filters';
import { parseFromUrl, updateUrl } from '../../utils/url';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useRecords } from '../../hooks/useRecords';
import styles from './RecordList.module.scss';
import classNames from 'classnames';
import { PanelLeft } from 'lucide-react';

export default function RecordList() {
  // Initialize state from URL on mount
  const initialState = useMemo(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return parseFromUrl(searchParams);
    }
    return {
      search: '',
      filters: {
        name: '',
        type: [],
        value: [],
        containerId: '',
        containerName: '',
        hostname: [],
        force: [],
      },
      sort: [{ key: 'dnsRecord.name' as const, ascending: true }],
    };
  }, []);

  // Declare state
  const { records, loading, error, lastUpdated, status, refresh } = useRecords();
  const [showSidebar, setShowSidebar] = useSidebarState();
  const [activeRecord, setActiveRecord] = useState<RecordEntry | null>(null);
  const [search, setSearch] = useState(initialState.search);
  const [filters, setFilters] = useState<Filters>(initialState.filters);
  const [sort, setSort] = useState<SortState>(initialState.sort);

  // Track if we should update URL (to avoid infinite loops during initialization)
  const isInitializing = useRef(true);

  // Mark initialization as complete after first render
  useEffect(() => {
    isInitializing.current = false;
  }, []);

  // Sync URL whenever search, filters, or sort change (but not during initialization)
  useEffect(() => {
    if (!isInitializing.current) {
      updateUrl(search, filters, sort);
    }
  }, [search, filters, sort]);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlState = parseFromUrl(searchParams);
      setSearch(urlState.search);
      setFilters(urlState.filters);
      setSort(urlState.sort);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Memoize aggregated data
  const enrichedRecords = useMemo(() => enrichSearchable(records), [records]);
  const filteredRecords = useMemo(
    () => filterRecords(enrichedRecords, filters, search),
    [enrichedRecords, filters, search],
  );
  const sortedRecords = useMemo(() => sortRecords(filteredRecords, sort), [filteredRecords, sort]);
  const facetCounts = useMemo(
    () => getFacetCounts(filteredRecords, filters),
    [filteredRecords, filters],
  );
  const { recordTypes, recordValues, hostnames, forceValues } = useMemo(
    () => deriveFilterOptions(records),
    [records],
  );
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Set callbacks
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
  }, []);

  const handleSortChange = useCallback((next: SortState) => {
    setSort(next);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      name: '',
      type: [],
      value: [],
      containerId: '',
      containerName: '',
      hostname: [],
      force: [],
    });
  }, []);

  const resetAll = useCallback(() => {
    setSearch('');
    clearFilters();
  }, [clearFilters]);

  // Render
  return (
    <div className={styles.recordList}>
      <div className={classNames(styles.sidebar, { [styles.show]: showSidebar })}>
        <FilterSortDrawer
          show={showSidebar}
          onClose={() => setShowSidebar(false)}
          filters={filters}
          sort={sort}
          onSortChange={handleSortChange}
          availableSortFields={SORT_KEYS}
          onFilterChange={handleFilterChange}
          availableRecordTypes={recordTypes}
          availableRecordValues={recordValues}
          availableHostnames={hostnames}
          availableForce={forceValues}
          facetCounts={facetCounts}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
        />
      </div>
      <div className={classNames(styles.mainContent, { [styles.shifted]: showSidebar })}>
        <header className={styles.stickyHeader}>
          <div className={styles.toolbar}>
            {!showSidebar && (
              <button
                className={styles.hamburger}
                onClick={() => setShowSidebar((s) => !s)}
                aria-label={
                  activeFilterCount > 0
                    ? `Toggle filters (${activeFilterCount} active)`
                    : 'Toggle filters'
                }
              >
                <PanelLeft size={20} />
                {activeFilterCount > 0 && (
                  <span className={styles.filterBadge} aria-hidden="true">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
            <div className={styles.searchWrapper}>
              <SearchBar value={search} onChange={handleSearchChange} />
            </div>
          </div>
        </header>
        <h2 className={styles.pageTitle}>DNS Records</h2>
        {!loading && !error && (
          <StatusBar
            status={status}
            lastUpdated={lastUpdated}
            onRefresh={refresh}
            shown={sortedRecords.length}
            total={records.length}
            noun={records.length === 1 ? 'record' : 'records'}
          />
        )}
        {loading ? (
          <div className={styles.statusMessage} role="status" aria-live="polite">
            Loading records…
          </div>
        ) : error ? (
          <div className={styles.statusMessage} role="alert">
            <p>{error}</p>
            <button className={styles.retryButton} onClick={refresh}>
              Retry
            </button>
          </div>
        ) : (
          <RecordGrid
            records={sortedRecords}
            onSelect={setActiveRecord}
            canReset={search.trim().length > 0 || activeFilterCount > 0}
            onReset={resetAll}
          />
        )}
      </div>
      {activeRecord && <RecordModal record={activeRecord} onClose={() => setActiveRecord(null)} />}
    </div>
  );
}
