import { Record } from '../types';

function getUniqueSorted<T>(items: T[]): T[] {
  const unique = Array.from(new Set(items));
  if (typeof unique[0] === 'boolean') {
    return unique.sort((a, b) => Number(b as boolean) - Number(a as boolean));
  }
  return unique.sort((a, b) => String(a).localeCompare(String(b)));
}

export function deriveFilterOptions(records: Record[]) {
  return {
    recordTypes: getUniqueSorted(records.map(r => r.dnsRecord.type)),
    recordValues: getUniqueSorted(records.map(r => r.dnsRecord.value)),
    hostnames: getUniqueSorted(records.map(r => r.metadata.hostname)),
    forceValues: getUniqueSorted(records.map(r => r.metadata.force)),
  };
}
