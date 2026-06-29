import { useMemo, useState, useCallback, useDeferredValue } from 'react';
import { Filters, SortState } from '../../types';
import { deriveFilterOptions } from '../../utils/filters';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterSortDrawer from '../../components/FilterSortDrawer/FilterSortDrawer';
import RecordGrid from '../../components/RecordGrid/RecordGrid';
import RecordModal from '../../components/RecordModal/RecordModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import ListStatus from '../../components/ListStatus/ListStatus';
import { SORT_KEYS, sortRecords } from '../../utils/sort';
import { enrichSearchable, getRecordKey } from '../../utils/record';
import { filterRecords, getFacetCounts, countActiveFilters } from '../../utils/filters';
import { parseFromUrl, serializeToUrl } from '../../utils/url';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useUrlSync } from '../../hooks/useUrlSync';
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
      selectedKey: null as string | null,
    };
  }, []);

  // Declare state
  const { records, loading, error, lastUpdated, status, refresh } = useRecords();
  const [showSidebar, setShowSidebar] = useSidebarState();
  // The open record is tracked by its key (and mirrored in the URL) so a detail
  // view is shareable and survives reload; the record object is derived below.
  const [activeRecordKey, setActiveRecordKey] = useState<string | null>(initialState.selectedKey);
  const [search, setSearch] = useState(initialState.search);
  const [filters, setFilters] = useState<Filters>(initialState.filters);
  const [sort, setSort] = useState<SortState>(initialState.sort);

  // Mirror state in the URL (replaceState, so it stays shareable/reloadable
  // without polluting history) and apply Back/Forward changes back into state.
  const queryString = useMemo(
    () => serializeToUrl(search, filters, sort, activeRecordKey),
    [search, filters, sort, activeRecordKey],
  );
  useUrlSync(queryString, () => {
    const urlState = parseFromUrl(new URLSearchParams(window.location.search));
    setSearch(urlState.search);
    setFilters(urlState.filters);
    setSort(urlState.sort);
    setActiveRecordKey(urlState.selectedKey);
  });

  // Defer the search term so filtering a large list stays off the typing path:
  // the input updates immediately while the (potentially expensive) re-filter
  // runs at a lower priority.
  const deferredSearch = useDeferredValue(search);

  // Memoize aggregated data
  const enrichedRecords = useMemo(() => enrichSearchable(records), [records]);
  const filteredRecords = useMemo(
    () => filterRecords(enrichedRecords, filters, deferredSearch),
    [enrichedRecords, filters, deferredSearch],
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
  // Resolve the open record from its key once records are loaded (so a
  // deep-linked modal opens after the initial fetch resolves).
  const activeRecord = useMemo(
    () => records.find((r) => getRecordKey(r) === activeRecordKey) ?? null,
    [records, activeRecordKey],
  );

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
        {loading || error ? (
          <ListStatus
            loading={loading}
            error={error}
            loadingLabel="Loading records…"
            onRetry={refresh}
          />
        ) : (
          <RecordGrid
            records={sortedRecords}
            onSelect={(record) => setActiveRecordKey(getRecordKey(record))}
            canReset={search.trim().length > 0 || activeFilterCount > 0}
            onReset={resetAll}
          />
        )}
      </div>
      {activeRecord && (
        <RecordModal record={activeRecord} onClose={() => setActiveRecordKey(null)} />
      )}
    </div>
  );
}
