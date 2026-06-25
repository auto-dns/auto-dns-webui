import { describe, it, expect } from 'vitest';
import { getValueByPath } from './object';

describe('getValueByPath', () => {
  const obj = { dnsRecord: { name: 'app.example.com' }, metadata: { force: true } };

  it('reads a nested value by dotted path', () => {
    expect(getValueByPath(obj, 'dnsRecord.name')).toBe('app.example.com');
    expect(getValueByPath(obj, 'metadata.force')).toBe(true);
  });

  it('returns undefined for a missing path instead of throwing', () => {
    expect(getValueByPath(obj, 'metadata.missing')).toBeUndefined();
    expect(getValueByPath(obj, 'nope.deeper.still')).toBeUndefined();
  });
});
