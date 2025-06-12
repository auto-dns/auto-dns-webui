import { Record } from '../types';

export const getRecordKey = (record: Record) => `${record.dnsRecord.name}|${record.dnsRecord.type}|${record.dnsRecord.value}|${record.metadata.containerId}`;