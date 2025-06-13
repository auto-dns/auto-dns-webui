import styles from './SortChips.module.scss';
import { SORT_LABELS } from '../../utils/sort';
import { SortCriterion, SortState } from '../../types';

interface SortChipsProps {
  sort: SortState;
  onChange: (next: SortState) => void;
  availableFields: SortCriterion['key'][];
}

export default function SortChips({ sort, onChange, availableFields }: SortChipsProps) {
  const toggleDirection = (index: number) => {
    const updated = [...sort];
    updated[index].ascending = !updated[index].ascending;
    onChange(updated);
  };

  const removeLevel = (index: number) => {
    const updated = sort.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addLevel = () => {
    const remaining = availableFields.filter(
      (field) => !sort.some((s) => s.key === field)
    );
    const nextKey = remaining[0];
    if (nextKey) {
      onChange([...sort, { key: nextKey, ascending: true }]);
    }
  };

  return (
    <div className={styles.sortChips}>
      {sort.map((criterion, index) => (
        <div
          key={criterion.key}
          className={styles.chip}
          onClick={() => toggleDirection(index)}
          title="Click to toggle direction"
        >
          {SORT_LABELS[criterion.key]} {criterion.ascending ? '↑' : '↓'}
          <button
            className={styles.removeButton}
            onClick={(e) => {
              e.stopPropagation();
              removeLevel(index);
            }}
            title="Remove sort level"
          >
            ✕
          </button>
        </div>
      ))}
      {availableFields.some((f) => !sort.find((s) => s.key === f)) && (
        <button className={styles.addButton} onClick={addLevel}>
          + Add
        </button>
      )}
    </div>
  );
}
