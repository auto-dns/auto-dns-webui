import { EnrichedRecordEntry, RecordEntry, Filters, FacetCounts } from '../types';

function getUniqueSorted<T>(items: T[]): T[] {
  const unique = Array.from(new Set(items));
  if (typeof unique[0] === 'boolean') {
    return unique.sort((a, b) => Number(b as boolean) - Number(a as boolean));
  }
  return unique.sort((a, b) => String(a).localeCompare(String(b)));
}

export function deriveFilterOptions(records: RecordEntry[]) {
  return {
    recordTypes: getUniqueSorted(records.map(r => r.dnsRecord.type)),
    recordValues: getUniqueSorted(records.map(r => r.dnsRecord.value)),
    hostnames: getUniqueSorted(records.map(r => r.metadata.hostname)),
    forceValues: getUniqueSorted(records.map(r => r.metadata.force)),
  };
}

export function filterRecords(records: EnrichedRecordEntry[], filters: Filters, search: string) {
  return records.filter((r) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch = r.searchable.includes(searchText);

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
}

export function getFacetCounts(records: RecordEntry[], activeFilters: Filters): FacetCounts {
  const counts: {
    type: Record<string, number>;
    value: Record<string, number>;
    hostname: Record<string, number>;
    force: Record<string, number>;
  } = {
    type: {},
    value: {},
    hostname: {},
    force: {},
  };

  for (const record of records) {
    const { dnsRecord, metadata } = record;

    counts.type[dnsRecord.type] = (counts.type[dnsRecord.type] || 0) + 1;
    counts.value[dnsRecord.value] = (counts.value[dnsRecord.value] || 0) + 1;
    counts.hostname[metadata.hostname] = (counts.hostname[metadata.hostname] || 0) + 1;
    counts.force[metadata.force.toString()] = (counts.force[metadata.force.toString()] || 0) + 1;
  }

  return counts;
}
