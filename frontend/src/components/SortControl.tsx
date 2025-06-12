import { SortState } from '../types';

interface SortControlProps {
  sort: SortState;
  onChange: (sort: SortState) => void;
}

export default function SortControl({ sort, onChange }: SortControlProps) {
  return (
    <div className="sort-control">
      <label>Sort by:</label>
      <select
        value={sort.key}
        onChange={(e) =>
          onChange({ ...sort, key: e.target.value as SortState['key'] })
        }
      >
        <option value="dnsRecord.name">Name</option>
        <option value="dnsRecord.type">Type</option>
        <option value="dnsRecord.value">Value</option>
        <option value="metadata.containerName">Container Name</option>
        <option value="metadata.created">Created Datetime</option>
        <option value="metadata.hostname">Hostname</option>
      </select>
      <button
        onClick={() => onChange({ ...sort, ascending: !sort.ascending })}
      >
        {sort.ascending ? '↑' : '↓'}
      </button>
    </div>
  );
}