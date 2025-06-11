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

export interface Record {
  dnsRecord: DnsRecord;
  metadata: RecordMetadata;
}

export interface Filters {
  type: string[];
  host: string[];
  containerName: string;
  value: string;
}

export interface SortState {
  key: keyof Record;
  ascending: boolean;
}
