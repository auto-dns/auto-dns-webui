import { useMemo, useState, useEffect } from 'react';
import { Filters, Record, SortState } from '../types';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
// import SortControl from '../components/SortControl';
import RecordGrid from '../components/RecordGrid';
import '../styles/pages/RecordList.css';

export default function RecordList() {
  const [records, setRecords] = useState<Record[]>([]);
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
  const [sort, setSort] = useState<SortState>({
    key: 'dnsRecord.name',
    ascending: true,
  });
  
  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = Object.values(r)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesName = !filters.name || r.dnsRecord.name.includes(filters.name);
      const matchesType = !filters.type.length || filters.type.includes(r.dnsRecord.type);
      const matchesValue = !filters.value.length || filters.value.includes(r.dnsRecord.value);
      const matchesContainerId = !filters.containerId || r.metadata.containerId.includes(filters.containerId);
      const matchesContainerName = !filters.containerName || r.metadata.containerName.includes(filters.containerName);
      const matchesHostname = !filters.hostname.length || filters.hostname.includes(r.metadata.hostname);
      const matchesForce = !filters.force.length || filters.force.includes(r.metadata.force);

      return matchesSearch && matchesName && matchesType && matchesValue && matchesContainerId && matchesContainerName && matchesHostname && matchesForce;
    });
  }, [records, search, filters]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords.sort((a, b) => {
      const aVal = String(a[sort.key] ?? '').toLowerCase();
      const bVal = String(b[sort.key] ?? '').toLowerCase();
      return sort.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    })]
  }, [filteredRecords, sort]);

  // Filter options
  const [availableRecordTypes, availableRecordValues, availableHostnames, availableForce] = useMemo(() => {
    const availableRecordTypes = [...new Set(records.map(r => r.dnsRecord.type))]; // Sort in alphabetical order, ascending
    const availableRecordValues = [...new Set(records.map(r => r.dnsRecord.value))]; // Sort in alphabetical order, ascending
    const availableHostnames = [...new Set(records.map(r => r.metadata.hostname))]; // Sort in alphabetical order, ascending
    const availableForce = [...new Set(records.map(r => r.metadata.force))] // // Sort true, false
    return [availableRecordTypes, availableRecordValues, availableHostnames, availableForce];
  }, [records]);

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedKeys);
    updated.has(key) ? updated.delete(key) : updated.add(key);
    setExpandedKeys(updated);
  };

  return (
    <div className="record-list">
      <SearchBar
        value={search}
        onChange={setSearch}
      />
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        availableRecordTypes={availableRecordTypes}
        availableRecordValues={availableRecordValues}
        availableHostnames={availableHostnames}
        availableForce={availableForce}
      />
      <RecordGrid
        records={sortedRecords}
        toggleExpand={toggleExpand}
      />
    </div>
  );
};
