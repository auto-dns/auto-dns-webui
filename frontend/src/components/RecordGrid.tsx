import React, { useState } from 'react';
import RecordCard from '../components/RecordCard';
import { Record } from '../types';
import { getRecordKey } from '../utils/record';
import '../styles/components/RecordGrid.css';

interface RecordGridProps {
    records: Record[];
    toggleExpand: (key: string) => void;
}

const RecordGrid: React.FC<RecordGridProps> = ({ records }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedKeys);
    updated.has(key) ? updated.delete(key) : updated.add(key);
    setExpandedKeys(updated);
  };

  return (
    <div className="record-grid">
      {records.map((record) => {
        const key = getRecordKey(record);
        const isExpanded = expandedKeys.has(key);
        return (
          <RecordCard
            record={record}
            isExpanded={isExpanded}
            toggleExpand={toggleExpand}
          />
        );
      })}
    </div>
  );
};

export default RecordGrid;
