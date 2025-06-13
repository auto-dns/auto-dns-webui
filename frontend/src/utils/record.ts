import { RecordEntry } from '../types';

export const getRecordKey = (record: RecordEntry) => `${record.dnsRecord.name}|${record.dnsRecord.type}|${record.dnsRecord.value}|${record.metadata.containerId}`;

export function enrichSearchable(records: RecordEntry[]) {
  return records.map((r) => {
    const { dnsRecord, metadata } = r;
    const searchText = [
      dnsRecord.name,
      dnsRecord.type,
      dnsRecord.value,
      metadata.containerId,
      metadata.containerName,
      metadata.hostname,
      metadata.created,
      metadata.force?.toString(),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      ...r,
      searchable: searchText,
    };
  });
}
