// src/components/RecordTable.tsx
import React, { useState } from 'react';
import { Record } from '../types';
import './RecordTable.css';

interface RecordTableProps {
  records: Record[];
}

const RecordTable: React.FC<RecordTableProps> = ({ records }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedKeys);
    updated.has(key) ? updated.delete(key) : updated.add(key);
    setExpandedKeys(updated);
  };

  return (
    <div className="record-list">
      {records.map((record) => {
        const key = `${record.dnsRecord.name}|${record.dnsRecord.type}|${record.dnsRecord.value}|${record.metadata.containerId}`;
        const isExpanded = expandedKeys.has(key);
        return (
          <div
            key={key}
            className={`record-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpand(key)}
          >
            <div className="record-header">
              <span className="record-type">{record.dnsRecord.type}</span>
              <span className="record-name">{record.dnsRecord.name}</span>
              <span className="arrow">→</span>
              <span className="record-value">{record.dnsRecord.value}</span>
            </div>
            <div className="record-details">
              <div><strong>Host:</strong> {record.metadata.hostname}</div>
              {!isExpanded && <div className='toggle-details-link'>Show Details ▼</div>}
            </div>
            {isExpanded && (
              <div className="record-details">
                <div><strong>Container:</strong> {record.metadata.containerName}</div>
                <div><strong>Container ID:</strong> {record.metadata.containerId}</div>
                <div><strong>Created:</strong> {new Date(record.metadata.created).toLocaleString()}</div>
                <div><strong>Force:</strong> {record.metadata.force ? 'Yes' : 'No'}</div>
                <div className='toggle-details-link'>Hide Details ▲</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecordTable;
