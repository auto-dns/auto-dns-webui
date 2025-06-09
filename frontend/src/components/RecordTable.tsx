// src/components/RecordTable.tsx
import React, { useState } from 'react';
import { Record } from '../types';
import './RecordTable.css';

interface RecordTableProps {
  records: Record[];
}

const RecordTable: React.FC<RecordTableProps> = ({ records }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedRows(newSet);
  };

  return (
    <table className="record-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Name</th>
          <th>Value</th>
          <th>Host</th>
          <th>More</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const key = `${record.dnsRecord.name}|${record.dnsRecord.type}|${record.dnsRecord.value}`;
          const isExpanded = expandedRows.has(key);
          return (
            <React.Fragment key={key}>
              <tr>
                <td>{record.dnsRecord.type}</td>
                <td>{record.dnsRecord.name}</td>
                <td>{record.dnsRecord.value}</td>
                <td>{record.metadata.hostname}</td>
                <td>
                  <button onClick={() => toggleRow(key)}>
                    {isExpanded ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
              {isExpanded && (
                <tr className="expanded-row">
                  <td colSpan={5}>
                    <div><strong>Container Name:</strong> {record.metadata.containerName}</div>
                    <div><strong>Container ID:</strong> {record.metadata.containerId}</div>
                    <div><strong>Created:</strong> {new Date(record.metadata.created).toLocaleString()}</div>
                    <div><strong>Force:</strong> {record.metadata.force ? 'Yes' : 'No'}</div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

export default RecordTable;
