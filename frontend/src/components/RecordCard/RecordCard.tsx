import { ArrowRight } from 'lucide-react';
import { RecordEntry } from '../../types';
import styles from './RecordCard.module.scss';

interface RecordCardProps {
  record: RecordEntry;
  onSelect: (record: RecordEntry) => void;
}

export default function RecordCard({ record, onSelect }: RecordCardProps) {
  // Normalize the type so the color-coding selectors (which key off the
  // uppercase record type via data-type) match regardless of source casing.
  const type = record.dnsRecord.type?.toUpperCase() ?? '';

  return (
    <div
      className={styles.card}
      onClick={() => onSelect(record)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(record);
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.type} data-type={type}>
          {record.dnsRecord.type}
        </span>
        <span className={styles.name}>{record.dnsRecord.name}</span>
      </div>

      <div className={styles.valueRow}>
        <ArrowRight className={styles.arrow} size={14} aria-hidden="true" />
        <span className={styles.value}>{record.dnsRecord.value}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaLabel}>Host</span>
        <span className={styles.metaValue}>{record.metadata.hostname}</span>
      </div>
    </div>
  );
}
