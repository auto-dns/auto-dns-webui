import RecordCard from '../RecordCard/RecordCard';
import { RecordEntry } from '../../types';
import { getRecordKey } from '../../utils/record';
import styles from './RecordGrid.module.scss';

interface RecordGridProps {
  records: RecordEntry[];
  onSelect: (record: RecordEntry) => void;
  // When true, the empty state offers a reset action (a search/filter is the
  // likely reason nothing matched).
  canReset?: boolean;
  onReset?: () => void;
}

export default function RecordGrid({ records, onSelect, canReset, onReset }: RecordGridProps) {
  if (records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No records match your filters or search.</p>
        {canReset && onReset && (
          <button type="button" className={styles.resetButton} onClick={onReset}>
            Clear search & filters
          </button>
        )}
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
