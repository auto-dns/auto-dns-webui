import { useMemo } from 'react';
import { SortState, SortCriterion, SortKey } from '../../types';
import styles from './SortControl.module.scss';

interface SortControlProps {
  sort: SortState;
  onChange: (sort: SortState) => void;
}

export default function SortControl({ sort, onChange }: SortControlProps) {
  const optionLabelsByField: Record<SortKey, string> = {
    'dnsRecord.name': 'Record Name',
    'dnsRecord.type': 'Record Type',
    'dnsRecord.value': 'Record Value',
    'metadata.containerName': 'Container Name',
    'metadata.created': 'Created Datetime',
    'metadata.hostname': 'Hostname',
  } as const;

  const sortOptions = Object.keys(optionLabelsByField) as SortKey[];

  const [usedFields, availableSortOptions] = useMemo(() => {
    const used = new Set(sort.map((s) => s.key));
    const available = sortOptions.filter((key) => !used.has(key));
    return [used, available];
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
    const nextKey = availableSortOptions[0] as SortCriterion['key'];
    if (nextKey) {
      onChange([...sort, { key: nextKey, ascending: true }]);
    }
  };

  const removeSortLevel = (index: number) => {
    const updated = sort.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.control}>
      <label>Sort by:</label>
      {sort.map((criterion, i) => (
        <div key={i} className={styles.criterion}>
          <select
            value={criterion.key}
            onChange={(e) => handleKeyChange(i, e.target.value as SortCriterion['key'])}
          >
            <option value={criterion.key}>{optionLabelsByField[criterion.key]}</option>
            {availableSortOptions.map((field) => (
              <option
                key={field}
                value={field}
                disabled={sort.some((c, idx) => idx !== i && c.key === field)}
              >
                {optionLabelsByField[field]}
              </option>
            ))}
          </select>
          <button onClick={() => toggleDirection(i)}>
            {criterion.ascending ? '↑' : '↓'}
          </button>
          {sort.length > 1 && (
            <button onClick={() => removeSortLevel(i)} title="Remove sort level">
              ✕
            </button>
          )}
        </div>
      ))}
      <button disabled={!availableSortOptions.length} onClick={addSortLevel}>
        + Add Sort Level
      </button>
    </div>
  );
}
