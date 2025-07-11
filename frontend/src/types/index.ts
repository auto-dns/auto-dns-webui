export interface DnsRecord {
  name: string;
  type: string;
  value: string;
}

export interface RecordMetadata {
  containerId: string;
  containerName: string;
  created: string;
  hostname: string;
  force: boolean;
}

export interface RecordEntry {
  dnsRecord: DnsRecord;
  metadata: RecordMetadata;
}

export interface EnrichedRecordEntry extends RecordEntry {
  searchable: string;
}

export interface Filters {
  name: string
  type: string[];
  value: string[];
  containerId: string;
  containerName: string;
  hostname: string[];
  force: boolean[];
}

export interface FacetCounts {
  type: Record<string, number>;
  value: Record<string, number>;
  hostname: Record<string, number>;
  force: Record<'true' | 'false', number>;
}

export type SortKey =
  | 'dnsRecord.name'
  | 'dnsRecord.type'
  | 'dnsRecord.value'
  | 'metadata.containerName'
  | 'metadata.created'
  | 'metadata.hostname';

export interface SortCriterion {
  key: SortKey;
  ascending: boolean;
}

export type SortState = SortCriterion[];
