import { useMemo } from 'react'
import { SortState, SortCriterion } from '../types';

interface SortControlProps {
  sort: SortState;
  onChange: (sort: SortState) => void;
}

export default function SortControl({ sort, onChange }: SortControlProps) {
  const optionLabelsByField = {
    'dnsRecord.name': 'Record Name',
    'dnsRecord.type': 'Record Type',
    'dnsRecord.value': 'Record Value',
    'metadata.containerName': 'Container Name',
    'metadata.created': 'Created Datetime',
    'metadata.hostname': 'Hostname',
  }
  const sortOptions = [
    'dnsRecord.name',
    'dnsRecord.type',
    'dnsRecord.value',
    'metadata.containerName',
    'metadata.created',
    'metadata.hostname',
  ];

  const [usedFields, availableSortOptions] = useMemo(() => {
    const usedFields = new Set(sort.map(criterion => String(criterion.key)));
    const availableSortOptions = sortOptions.filter(sortOption => !usedFields.has(sortOption));
    return [usedFields, availableSortOptions]
  }, [sort]);

  const handleKeyChange = (index: number, newKey: SortCriterion['key']) => {
    const updated = [...sort];
    updated[index] = { ...updated[index], key: newKey };
    onChange(updated);
  };

  const toggleDirection = (index: number) => {
    const updated = [...sort];
    updated[index] = {
      ...updated[index],
      ascending: !updated[index].ascending,
    };
    onChange(updated);
  };

  const addSortLevel = () => {
    const firstAvailableOption = availableSortOptions[0] as SortCriterion['key'];
    onChange([...sort, { key: firstAvailableOption, ascending: true }]);
  };

  const removeSortLevel = (index: number) => {
    const updated = sort.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="sort-control">
      <label>Sort by:</label>
      {sort.map((criterion, i) => (
        <div key={i} className="sort-criterion">
          <select
            value={criterion.key}
            onChange={(e) => handleKeyChange(i, e.target.value as SortCriterion['key'])}
          >
            <option
              key={criterion.key}
              value={criterion.key}
            >
              {optionLabelsByField?.[criterion.key] || 'Unknown'}
            </option>
            {availableSortOptions.map((field) => (
              <option
                key={field}
                value={field}
                disabled={sort.some((c, idx) => idx !== i && c.key === field)}
              >
                {optionLabelsByField?.[field] || 'Unknown'}
              </option>
            ))}
          </select>
          <button onClick={() => toggleDirection(i)}>
            {criterion.ascending ? '↑' : '↓'}
          </button>
          {sort.length > 1 && (
            <button onClick={() => removeSortLevel(i)} title="Remove sort level">✕</button>
          )}
        </div>
      ))}
      <button
        disabled={!availableSortOptions.length}
        onClick={addSortLevel}
      >+ Add Sort Level</button>
    </div>
  );
}
