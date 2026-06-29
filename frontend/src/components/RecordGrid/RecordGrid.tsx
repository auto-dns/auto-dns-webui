import RecordCard from '../RecordCard/RecordCard';
import { RecordEntry } from '../../types';
import { getRecordKey } from '../../utils/record';
import styles from './RecordGrid.module.scss';

interface RecordGridProps {
  records: RecordEntry[];
  onSelect: (record: RecordEntry) => void;
}

export default function RecordGrid({ records, onSelect }: RecordGridProps) {
  if (records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No records match your filters or search.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {records.map((record) => (
        <RecordCard key={getRecordKey(record)} record={record} onSelect={onSelect} />
      ))}
    </div>
  );
}
