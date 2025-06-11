import React, { useState, useEffect } from 'react';
import RecordGrid from '../components/RecordGrid';
import { Record } from '../types';
import '../styles/pages/RecordList.css';

const RecordList: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedKeys);
    updated.has(key) ? updated.delete(key) : updated.add(key);
    setExpandedKeys(updated);
  };

  return (
    <div className="record-list">
      <RecordGrid
        records={records}
        toggleExpand={toggleExpand}
      />
    </div>
  );
};

export default RecordList;
