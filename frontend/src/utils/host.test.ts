import { describe, expect, it } from 'vitest';
import { filterHosts, formatTypeCounts } from './host';
import { HostSummary } from '../types';

function host(overrides: Partial<HostSummary>): HostSummary {
  return {
    hostname: 'h1',
    online: true,
    recordCount: 0,
    typeCounts: {},
    containers: [],
    ...overrides,
  };
}

describe('filterHosts', () => {
  const hosts = [
    host({ hostname: 'alpha', containers: [{ containerId: 'c1', containerName: 'web', recordCount: 2 }] }),
    host({ hostname: 'beta', containers: [{ containerId: 'c2', containerName: 'db', recordCount: 1 }] }),
  ];

  it('returns all hosts for an empty query', () => {
    expect(filterHosts(hosts, '')).toHaveLength(2);
    expect(filterHosts(hosts, '   ')).toHaveLength(2);
  });

  it('matches on hostname (case-insensitive)', () => {
    const got = filterHosts(hosts, 'ALPHA');
    expect(got).toHaveLength(1);
    expect(got[0].hostname).toBe('alpha');
  });

  it('matches on container name', () => {
    const got = filterHosts(hosts, 'db');
    expect(got).toHaveLength(1);
    expect(got[0].hostname).toBe('beta');
  });

  it('returns nothing when there is no match', () => {
    expect(filterHosts(hosts, 'zzz')).toHaveLength(0);
  });
});

describe('formatTypeCounts', () => {
  it('renders a sorted, compact breakdown', () => {
    expect(formatTypeCounts({ AAAA: 1, A: 3, CNAME: 2 })).toBe('A 3 · AAAA 1 · CNAME 2');
  });

  it('returns an empty string for no types', () => {
    expect(formatTypeCounts({})).toBe('');
  });
});
