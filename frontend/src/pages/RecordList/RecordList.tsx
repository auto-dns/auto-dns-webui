import { useMemo, useState, useEffect, useCallback } from 'react';
import { Filters, Record, SortState } from '../../types';
import { deriveFilterOptions } from '../../utils/filters';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import SortControl from '../../components/SortControl/SortControl';
import RecordGrid from '../../components/RecordGrid/RecordGrid';
import { getValueByPath } from '../../utils/object';
import styles from './RecordList.module.scss';

export default function RecordList() {
  const [records, setRecords] = useState<Record[]>([]);
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

  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);

  const enrichedRecords = useMemo(() => {
    return records.map((r) => ({
      ...r,
      searchable: Object.values(r).join(' ').toLowerCase(),
    }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter((r) => {
      const matchesSearch = r.searchable.includes(search.toLowerCase());

      const matchesName = !filters.name || r.dnsRecord.name.includes(filters.name);
      const matchesType = !filters.type.length || filters.type.includes(r.dnsRecord.type);
      const matchesValue = !filters.value.length || filters.value.includes(r.dnsRecord.value);
      const matchesContainerId = !filters.containerId || r.metadata.containerId.includes(filters.containerId);
      const matchesContainerName = !filters.containerName || r.metadata.containerName.includes(filters.containerName);
      const matchesHostname = !filters.hostname.length || filters.hostname.includes(r.metadata.hostname);
      const matchesForce = !filters.force.length || filters.force.includes(r.metadata.force);

      return (
        matchesSearch &&
        matchesName &&
        matchesType &&
        matchesValue &&
        matchesContainerId &&
        matchesContainerName &&
        matchesHostname &&
        matchesForce
      );
    });
  }, [records, search, filters]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      for (const criterion of sort) {
        const aVal = String(getValueByPath(a, criterion.key) ?? '').toLowerCase();
        const bVal = String(getValueByPath(b, criterion.key) ?? '').toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        if (cmp !== 0) {
          return criterion.ascending ? cmp : -cmp;
        }
      }
      return a.dnsRecord.name.localeCompare(b.dnsRecord.name);
    });
  }, [filteredRecords, sort]);

  const {recordTypes, recordValues, hostnames, forceValues} = useMemo(() => deriveFilterOptions(records), [records]);

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

  return (
    <div className={styles.recordList}>
      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={handleSearchChange} />
        <SortControl sort={sort} onChange={handleSortChange} />
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={styles.toggleFilters}
          aria-expanded={showFilters}
          aria-controls="filterDrawer"
        >
          {showFilters ? '× Close Filters' : '☰ Filters'}
        </button>
      </div>
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          availableRecordTypes={recordTypes}
          availableRecordValues={recordValues}
          availableHostnames={hostnames}
          availableForce={forceValues}
        />
      )}
      <RecordGrid records={sortedRecords} toggleExpand={toggleExpand} />
    </div>
  );
}
