// src/components/RecordTable.tsx
import React, { useState, useMemo } from 'react';
import { Record } from '../types';
import './RecordTable.css';

interface RecordTableProps {
  records: Record[];
}

type SortKey = 'name' | 'type' | 'value' | 'hostname';
type SortDirection = 'asc' | 'desc';

const RecordTable: React.FC<RecordTableProps> = ({ records }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleRow = (key: string) => {
    const newSet = new Set(expandedRows);
    newSet.has(key) ? newSet.delete(key) : newSet.add(key);
    setExpandedRows(newSet);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    return [...records]
      .filter((r) => {
        const q = filterText.toLowerCase();
        return (
          r.dnsRecord.name.toLowerCase().includes(q) ||
          r.dnsRecord.type.toLowerCase().includes(q) ||
          r.dnsRecord.value.toLowerCase().includes(q) ||
          r.metadata.containerId.toLowerCase().includes(q) ||
          r.metadata.containerName.toLowerCase().includes(q) ||
          r.metadata.created.toLowerCase().includes(q) ||
          r.metadata.hostname.toLowerCase().includes(q) ||
          (r.metadata.force ? 'Yes' : 'No').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aVal = a.dnsRecord[sortKey] ?? a.metadata[sortKey];
        const bVal = b.dnsRecord[sortKey] ?? b.metadata[sortKey];
        if (!aVal || !bVal) return 0;
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
  }, [records, filterText, sortKey, sortDirection]);

  return (
    <div className="records-container">
      <input
        type="text"
        placeholder="Filter records..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="record-filter"
      />
      <table className="record-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('type')}>Type</th>
            <th onClick={() => handleSort('name')}>Name</th>
            <th onClick={() => handleSort('value')}>Value</th>
            <th onClick={() => handleSort('hostname')}>Host</th>
            <th>More</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSorted.map((record) => {
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
    </div>
  );
};

export default RecordTable;
