import { RecordEntry, SortCriterion, SortState } from '../types';
import { getValueByPath } from './object';

export const SORT_LABELS: Record<SortCriterion['key'], string> = {
  'dnsRecord.name': 'Record Name',
  'dnsRecord.type': 'Record Type',
  'dnsRecord.value': 'Record Value',
  'metadata.containerName': 'Container Name',
  'metadata.created': 'Created',
  'metadata.hostname': 'Hostname',
};

export const SORT_KEYS = Object.keys(SORT_LABELS) as SortCriterion['key'][];

function compareRecords(a: RecordEntry, b: RecordEntry, sort: SortState) {
  for (const criterion of sort) {
    const aVal = String(getValueByPath(a, criterion.key) ?? '').toLowerCase();
    const bVal = String(getValueByPath(b, criterion.key) ?? '').toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    if (cmp !== 0) {
      return criterion.ascending ? cmp : -cmp;
    }
  }
  return a.dnsRecord.name.localeCompare(b.dnsRecord.name);
}

export function sortRecords(records: RecordEntry[], sort: SortState) {
  return [...records].sort((a, b) => compareRecords(a, b, sort));
}
