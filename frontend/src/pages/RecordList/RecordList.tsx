import { useMemo, useState, useEffect, useCallback } from 'react';
import { Filters, RecordEntry, SortState } from '../../types';
import { deriveFilterOptions } from '../../utils/filters';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterSortDrawer from '../../components/FilterSortDrawer/FilterSortDrawer';
import SortChips from '../../components/SortChips/SortChips';
import RecordGrid from '../../components/RecordGrid/RecordGrid';
import { SORT_KEYS, sortRecords } from '../../utils/sort';
import { enrichSearchable } from '../../utils/record';
import { filterRecords } from '../../utils/filters';
import styles from './RecordList.module.scss';

export default function RecordList() {
  // Declare state
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
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

  // Use effects
  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);

  // Memoize aggregated data
  const enrichedRecords = useMemo(() => enrichSearchable(records), [records]);
  const filteredRecords = useMemo(() => filterRecords(enrichedRecords, filters, search), [enrichedRecords, filters, search]);
  const sortedRecords = useMemo(() => sortRecords(filteredRecords, sort), [filteredRecords, sort]);
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
      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={handleSearchChange} />
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={styles.toggleFilters}
          aria-expanded={showFilters}
          aria-controls="filterDrawer"
        >
          {showFilters ? '× Close Filters' : '☰ Filters'}
        </button>
      </div>
      <div className={styles.mainContent}>
        <FilterSortDrawer
          show={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          sort={sort}
          onSortChange={handleSortChange}
          availableSortFields={SORT_KEYS}
          onFilterChange={handleFilterChange}
          availableRecordTypes={recordTypes}
          availableRecordValues={recordValues}
          availableHostnames={hostnames}
          availableForce={forceValues}
        />
        <RecordGrid records={sortedRecords} expandedKeys={expandedKeys} toggleExpand={toggleExpand} />
      </div>
    </div>
  );
}
