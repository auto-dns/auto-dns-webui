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
  name: string
  type: string[];
  value: string[];
  containerId: string;
  containerName: string;
  hostname: string[];
  force: boolean[];
}

export interface SortState {
  key: 'dnsRecord.name' | 'dnsRecord.type' | 'dnsRecord.value' | 'metadata.containerName' | 'metadata.created' | 'metadata.hostname';
  ascending: boolean;
}
