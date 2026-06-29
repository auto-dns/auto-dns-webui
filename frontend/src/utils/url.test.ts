import { describe, it, expect } from 'vitest';
import { Filters, SortState } from '../types';
import { serializeToUrl, parseFromUrl } from './url';

const emptyFilters = (): Filters => ({
  name: '',
  type: [],
  value: [],
  containerId: '',
  containerName: '',
  hostname: [],
  force: [],
});

const DEFAULT_SORT: SortState = [{ key: 'dnsRecord.name', ascending: true }];

describe('serializeToUrl', () => {
  it('omits the default sort and empty filters', () => {
    expect(serializeToUrl('', emptyFilters(), DEFAULT_SORT)).toBe('');
  });

  it('serializes search and filters with friendly keys', () => {
    const f = { ...emptyFilters(), type: ['A', 'CNAME'], hostname: ['alpha'] };
    const qs = new URLSearchParams(serializeToUrl('myquery', f, DEFAULT_SORT));
    expect(qs.get('q')).toBe('myquery');
    expect(qs.get('type')).toBe('A,CNAME');
    expect(qs.get('hostname')).toBe('alpha');
  });

  it('includes a non-default sort using friendly names', () => {
    const sort: SortState = [{ key: 'metadata.created', ascending: false }];
    const qs = new URLSearchParams(serializeToUrl('', emptyFilters(), sort));
    expect(qs.get('sort')).toBe('created:desc');
  });

  it('includes the selected record key when provided', () => {
    const qs = new URLSearchParams(
      serializeToUrl('', emptyFilters(), DEFAULT_SORT, 'app.example.com|A|10.0.0.1|abc'),
    );
    expect(qs.get('record')).toBe('app.example.com|A|10.0.0.1|abc');
  });

  it('omits the selected record key when null', () => {
    expect(serializeToUrl('', emptyFilters(), DEFAULT_SORT, null)).toBe('');
  });
});

describe('parseFromUrl', () => {
  it('round-trips search, filters, and sort', () => {
    const f = { ...emptyFilters(), name: 'app', type: ['A'], force: [true] };
    const sort: SortState = [{ key: 'metadata.hostname', ascending: false }];
    const serialized = serializeToUrl('q1', f, sort);

    const parsed = parseFromUrl(new URLSearchParams(serialized));
    expect(parsed.search).toBe('q1');
    expect(parsed.filters.name).toBe('app');
    expect(parsed.filters.type).toEqual(['A']);
    expect(parsed.filters.force).toEqual([true]);
    expect(parsed.sort).toEqual(sort);
  });

  it('returns the default sort when the sort param is absent', () => {
    expect(parseFromUrl(new URLSearchParams('')).sort).toEqual(DEFAULT_SORT);
  });

  it('round-trips the selected record key', () => {
    const key = 'app.example.com|A|10.0.0.1|abc';
    const serialized = serializeToUrl('', emptyFilters(), DEFAULT_SORT, key);
    expect(parseFromUrl(new URLSearchParams(serialized)).selectedKey).toBe(key);
  });

  it('returns a null selected key when the param is absent', () => {
    expect(parseFromUrl(new URLSearchParams('')).selectedKey).toBeNull();
  });

  it('falls back to the default sort on an invalid sort key', () => {
    expect(parseFromUrl(new URLSearchParams('sort=bogus:asc')).sort).toEqual(DEFAULT_SORT);
  });
});
