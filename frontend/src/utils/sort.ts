import { Record, SortCriterion } from '../types';
import { getValueByPath } from './object';

export function compareRecords(a: Record, b: Record, sort: SortCriterion[]) {
  for (const criterion of sort) {
    const aVal = String(getValueByPath(a, criterion.key) ?? '').toLowerCase();
    const bVal = String(getValueByPath(b, criterion.key) ?? '').toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    if (cmp !== 0) {
      return criterion.ascending ? cmp : -cmp;
    }
  }
  return 0;
}
