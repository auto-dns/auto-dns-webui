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
    recordTypes: getUniqueSorted(records.map((r) => r.dnsRecord.type)),
    recordValues: getUniqueSorted(records.map((r) => r.dnsRecord.value)),
    hostnames: getUniqueSorted(records.map((r) => r.metadata.hostname)),
    forceValues: getUniqueSorted(records.map((r) => r.metadata.force)),
  };
}

// Case-insensitive substring match.
function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// Number of active filter constraints (used for the "filters applied" badge and
// to decide whether an empty result is due to filtering). Search is tracked
// separately since it's always visible in the search bar.
export function countActiveFilters(filters: Filters): number {
  return (
    (filters.name.trim() ? 1 : 0) +
    (filters.containerId.trim() ? 1 : 0) +
    (filters.containerName.trim() ? 1 : 0) +
    filters.type.length +
    filters.value.length +
    filters.hostname.length +
    filters.force.length
  );
}

export function filterRecords(records: EnrichedRecordEntry[], filters: Filters, search: string) {
  return records.filter((r) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch = r.searchable.includes(searchText);

    // Free-text field filters are case-insensitive to match the global search
    // (typing "App" should find "app.example.com"), and whitespace-only input is
    // treated as inactive so it agrees with countActiveFilters / the URL state.
    const name = filters.name.trim();
    const containerId = filters.containerId.trim();
    const containerName = filters.containerName.trim();
    const matchesName = !name || includesCI(r.dnsRecord.name, name);
    const matchesType = !filters.type.length || filters.type.includes(r.dnsRecord.type);
    const matchesValue = !filters.value.length || filters.value.includes(r.dnsRecord.value);
    const matchesContainerId = !containerId || includesCI(r.metadata.containerId, containerId);
    const matchesContainerName =
      !containerName || includesCI(r.metadata.containerName, containerName);
    const matchesHostname =
      !filters.hostname.length || filters.hostname.includes(r.metadata.hostname);
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
