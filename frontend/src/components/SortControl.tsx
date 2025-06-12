import { SortState } from '../types';

interface SortControlProps {
  sort: SortState;
  onChange: (sort: SortState) => void;
}

export function SortControl({ sort, onChange }: SortControlProps) {
  return (
    <div className="sort-control">
      <label>Sort by:</label>
      <select
        value={sort.key}
        onChange={(e) =>
          onChange({ ...sort, key: e.target.value as SortState['key'] })
        }
      >
        <option value="name">Name</option>
        <option value="recordType">Type</option>
        <option value="host">Host</option>
        <option value="value">Value</option>
      </select>
      <button
        onClick={() => onChange({ ...sort, ascending: !sort.ascending })}
      >
        {sort.ascending ? '↑' : '↓'}
      </button>
    </div>
  );
}