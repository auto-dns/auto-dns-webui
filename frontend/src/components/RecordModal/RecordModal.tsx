import { ArrowRight } from 'lucide-react';
import { RecordEntry } from '../../types';
import Modal from '../Modal/Modal';
import styles from './RecordModal.module.scss';

interface RecordModalProps {
  record: RecordEntry;
  onClose: () => void;
}

export default function RecordModal({ record, onClose }: RecordModalProps) {
  const type = record.dnsRecord.type?.toUpperCase() ?? '';
  const { dnsRecord, metadata } = record;

  return (
    <Modal onClose={onClose} labelledBy="record-modal-title">
      <div className={styles.header}>
        <span className={styles.type} data-type={type}>
          {dnsRecord.type}
        </span>
        <h2 id="record-modal-title" className={styles.name}>
          {dnsRecord.name}
        </h2>
      </div>

      <div className={styles.valueRow}>
        <ArrowRight className={styles.arrow} size={16} aria-hidden="true" />
        <span className={styles.value}>{dnsRecord.value}</span>
      </div>

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Host</dt>
          <dd>{metadata.hostname || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Container</dt>
          <dd>{metadata.containerName || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Container ID</dt>
          <dd className={styles.mono}>{metadata.containerId || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Created</dt>
          <dd>{metadata.created ? new Date(metadata.created).toLocaleString() : '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Force</dt>
          <dd>{metadata.force ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </Modal>
  );
}
