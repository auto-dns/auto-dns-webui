import { describe, it, expect } from 'vitest';
import { Filters, RecordEntry } from '../types';
import { deriveFilterOptions, filterRecords, getFacetCounts } from './filters';
import { enrichSearchable } from './record';

function rec(
  name: string,
  type: string,
  value: string,
  hostname: string,
  force = false,
): RecordEntry {
  return {
    dnsRecord: { name, type, value },
    metadata: { containerId: 'id-' + name, containerName: name, created: '2024-01-01T00:00:00Z', hostname, force },
  };
}

const sample: RecordEntry[] = [
  rec('app.example.com', 'A', '10.0.0.1', 'alpha', true),
  rec('db.example.com', 'AAAA', 'fd00::1', 'beta', false),
  rec('www.example.com', 'CNAME', 'app.example.com', 'alpha', false),
];

const emptyFilters = (): Filters => ({
  name: '',
  type: [],
  value: [],
  containerId: '',
  containerName: '',
  hostname: [],
  force: [],
});

describe('deriveFilterOptions', () => {
  it('returns unique, sorted option lists', () => {
    const opts = deriveFilterOptions(sample);
    expect(opts.recordTypes).toEqual(['A', 'AAAA', 'CNAME']);
    expect(opts.hostnames).toEqual(['alpha', 'beta']);
    expect(opts.forceValues).toEqual([true, false]); // booleans sorted true-first
  });
});

describe('filterRecords', () => {
  const enriched = enrichSearchable(sample);

  it('returns all when no filters or search', () => {
    expect(filterRecords(enriched, emptyFilters(), '')).toHaveLength(3);
  });

  it('filters by type', () => {
    const f = { ...emptyFilters(), type: ['A'] };
    const out = filterRecords(enriched, f, '');
    expect(out.map((r) => r.dnsRecord.name)).toEqual(['app.example.com']);
  });

  it('filters by hostname (multi-select)', () => {
    const f = { ...emptyFilters(), hostname: ['alpha'] };
    expect(filterRecords(enriched, f, '')).toHaveLength(2);
  });

  it('filters by force', () => {
    const f = { ...emptyFilters(), force: [true] };
    expect(filterRecords(enriched, f, '')).toHaveLength(1);
  });

  it('applies free-text search across fields (case-insensitive)', () => {
    expect(filterRecords(enriched, emptyFilters(), 'BETA')).toHaveLength(1);
    expect(filterRecords(enriched, emptyFilters(), 'fd00')).toHaveLength(1);
  });

  it('combines filters with AND semantics', () => {
    const f = { ...emptyFilters(), hostname: ['alpha'], type: ['CNAME'] };
    expect(filterRecords(enriched, f, '').map((r) => r.dnsRecord.name)).toEqual(['www.example.com']);
  });
});

describe('getFacetCounts', () => {
  it('counts records per facet value', () => {
    const counts = getFacetCounts(sample, emptyFilters());
    expect(counts.type).toEqual({ A: 1, AAAA: 1, CNAME: 1 });
    expect(counts.hostname).toEqual({ alpha: 2, beta: 1 });
    expect(counts.force).toEqual({ true: 1, false: 2 });
  });
});
