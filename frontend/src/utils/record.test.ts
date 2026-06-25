import { describe, it, expect } from 'vitest';
import { RecordEntry } from '../types';
import { getRecordKey, enrichSearchable } from './record';

function makeRecord(overrides: Partial<RecordEntry['dnsRecord']> = {}): RecordEntry {
  return {
    dnsRecord: { name: 'app.example.com', type: 'A', value: '10.0.0.1', ...overrides },
    metadata: {
      containerId: 'abc123',
      containerName: 'web',
      created: '2024-01-02T03:04:05Z',
      hostname: 'alpha',
      force: true,
    },
  };
}

describe('getRecordKey', () => {
  it('joins name, type, value, and container id', () => {
    expect(getRecordKey(makeRecord())).toBe('app.example.com|A|10.0.0.1|abc123');
  });

  it('distinguishes records that differ only by type', () => {
    expect(getRecordKey(makeRecord({ type: 'A' }))).not.toBe(getRecordKey(makeRecord({ type: 'AAAA' })));
  });
});

describe('enrichSearchable', () => {
  it('adds a lowercased searchable string covering all fields', () => {
    const [r] = enrichSearchable([makeRecord()]);
    expect(r.searchable).toContain('app.example.com');
    expect(r.searchable).toContain('alpha');
    expect(r.searchable).toContain('web');
    expect(r.searchable).toContain('true');
    expect(r.searchable).toBe(r.searchable.toLowerCase());
  });

  it('preserves the original record fields', () => {
    const [r] = enrichSearchable([makeRecord()]);
    expect(r.dnsRecord.name).toBe('app.example.com');
    expect(r.metadata.hostname).toBe('alpha');
  });
});
