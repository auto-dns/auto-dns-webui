import { RecordEntry } from '../types';

export const getRecordKey = (record: RecordEntry) => `${record.dnsRecord.name}|${record.dnsRecord.type}|${record.dnsRecord.value}|${record.metadata.containerId}`;

export function enrichSearchable(records: RecordEntry[]) {
  return records.map((r) => ({
    ...r,
    searchable: Object.values(r).join(' ').toLowerCase(),
  }));
}
