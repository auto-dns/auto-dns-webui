import { describe, it, expect } from 'vitest';
import { RecordEntry, SortState } from '../types';
import { sortRecords, SORT_KEYS } from './sort';

function rec(name: string, type = 'A', hostname = 'alpha'): RecordEntry {
  return {
    dnsRecord: { name, type, value: '10.0.0.1' },
    metadata: { containerId: 'id', containerName: 'c', created: '2024-01-01T00:00:00Z', hostname, force: false },
  };
}

const names = (rs: RecordEntry[]) => rs.map((r) => r.dnsRecord.name);

describe('SORT_KEYS', () => {
  it('exposes the expected sortable keys', () => {
    expect(SORT_KEYS).toContain('dnsRecord.name');
    expect(SORT_KEYS).toContain('metadata.created');
    expect(SORT_KEYS).toContain('metadata.hostname');
  });
});

describe('sortRecords', () => {
  it('sorts ascending by a single key', () => {
    const sort: SortState = [{ key: 'dnsRecord.name', ascending: true }];
    expect(names(sortRecords([rec('c'), rec('a'), rec('b')], sort))).toEqual(['a', 'b', 'c']);
  });

  it('sorts descending by a single key', () => {
    const sort: SortState = [{ key: 'dnsRecord.name', ascending: false }];
    expect(names(sortRecords([rec('a'), rec('c'), rec('b')], sort))).toEqual(['c', 'b', 'a']);
  });

  it('applies secondary sort keys and falls back to name as tiebreaker', () => {
    const sort: SortState = [{ key: 'metadata.hostname', ascending: true }];
    const input = [rec('z', 'A', 'beta'), rec('a', 'A', 'alpha'), rec('b', 'A', 'alpha')];
    // alpha group first (a, b by name tiebreak), then beta (z)
    expect(names(sortRecords(input, sort))).toEqual(['a', 'b', 'z']);
  });

  it('does not mutate the input array', () => {
    const input = [rec('b'), rec('a')];
    sortRecords(input, [{ key: 'dnsRecord.name', ascending: true }]);
    expect(names(input)).toEqual(['b', 'a']);
  });
});
