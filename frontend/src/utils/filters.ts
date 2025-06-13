import { EnrichedRecordEntry, RecordEntry, Filters } from '../types';

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
}
