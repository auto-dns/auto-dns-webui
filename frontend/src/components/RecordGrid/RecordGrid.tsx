import { useState } from 'react';
import RecordCard from '../RecordCard/RecordCard';
import { RecordEntry } from '../../types';
import { getRecordKey } from '../../utils/record';
import styles from './RecordGrid.module.scss';

interface RecordGridProps {
  records: RecordEntry[];
  expandedKeys: Set<string>;
  toggleExpand: (key: string) => void;
}

export default function RecordGrid({ records, expandedKeys, toggleExpand }: RecordGridProps) {
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
