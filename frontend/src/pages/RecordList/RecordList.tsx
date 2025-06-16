import { useMemo, useState, useEffect, useCallback } from 'react';
import { Filters, RecordEntry, SortState } from '../../types';
import { deriveFilterOptions } from '../../utils/filters';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterSortDrawer from '../../components/FilterSortDrawer/FilterSortDrawer';
import RecordGrid from '../../components/RecordGrid/RecordGrid';
import { SORT_KEYS, sortRecords } from '../../utils/sort';
import { enrichSearchable } from '../../utils/record';
import { filterRecords, getFacetCounts } from '../../utils/filters';
import styles from './RecordList.module.scss';
import classNames from 'classnames';

export default function RecordList() {
  // Declare state
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({
    name: '',
    type: [],
    value: [],
    containerId: '',
    containerName: '',
    hostname: [],
    force: [],
  });
  const [sort, setSort] = useState<SortState>([
    { key: 'dnsRecord.name', ascending: true },
  ]);
  const [scrolled, setScrolled] = useState(false);

  // Use effects
  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Memoize aggregated data
  const enrichedRecords = useMemo(() => enrichSearchable(records), [records]);
  const filteredRecords = useMemo(() => filterRecords(enrichedRecords, filters, search), [enrichedRecords, filters, search]);
  const sortedRecords = useMemo(() => sortRecords(filteredRecords, sort), [filteredRecords, sort]);
  const facetCounts = useMemo(() => getFacetCounts(filteredRecords, filters), [filteredRecords, filters]);
  const {recordTypes, recordValues, hostnames, forceValues} = useMemo(() => deriveFilterOptions(records), [records]);

  // Set callbacks
  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const updated = new Set(prev);
      updated.has(key) ? updated.delete(key) : updated.add(key);
      return updated;
    });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
  }, []);

  const handleSortChange = useCallback((next: SortState) => {
    setSort(next);
  }, []);

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
        />
      </div>
      <div className={classNames(styles.mainContent, { [styles.shifted]: showSidebar })}>
        <header className={styles.stickyHeader}>
          <div className={styles.toolbar}>
            {!showSidebar && (
              <button
                className={styles.hamburger}
                onClick={() => setShowSidebar(s => !s)}
                aria-label='Toggle filters'
              >
                ☰
              </button>
            )}
            <div className={styles.searchWrapper}>
              <SearchBar value={search} onChange={handleSearchChange} />
            </div>
          </div>
        </header>
        <h2 className={styles.pageTitle}>DNS Records</h2>
        <RecordGrid
          records={sortedRecords}
          expandedKeys={expandedKeys}
          toggleExpand={toggleExpand}
        />
      </div>
    </div>
  );
}
