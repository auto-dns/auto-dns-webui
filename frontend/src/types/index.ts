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

// HostContainer summarizes one container's contribution to a host's records.
export interface HostContainer {
  containerId: string;
  containerName: string;
  recordCount: number;
}

// HostSummary is the per-host aggregation served by GET /api/hosts: a
// docker-coredns-sync node's liveness (from its etcd heartbeat) plus stats
// derived from the DNS records it owns.
export interface HostSummary {
  hostname: string;
  online: boolean;
  recordCount: number;
  typeCounts: Record<string, number>;
  containers: HostContainer[];
  lastPublished?: string;
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
