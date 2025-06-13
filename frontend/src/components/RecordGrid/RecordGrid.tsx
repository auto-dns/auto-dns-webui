import { useState } from 'react';
import RecordCard from '../RecordCard/RecordCard';
import { Record } from '../../types';
import { getRecordKey } from '../../utils/record';
import styles from './RecordGrid.module.scss';

interface RecordGridProps {
  records: Record[];
  toggleExpand: (key: string) => void;
}

export default function RecordGrid({ records }: RecordGridProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedKeys);
    updated.has(key) ? updated.delete(key) : updated.add(key);
    setExpandedKeys(updated);
  };

  return (
    <div className={styles.grid}>
      {records.map((record) => {
        const key = getRecordKey(record);
        const isExpanded = expandedKeys.has(key);
        return (
          <RecordCard
            key={key}
            record={record}
            isExpanded={isExpanded}
            toggleExpand={toggleExpand}
          />
        );
      })}
    </div>
  );
}
