import styles from './StyledFacet.module.scss';

interface StyledFacetProps {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  counts?: Record<string, number>;
}

export default function StyledFacet({ label, options, selected, onToggle, counts }: StyledFacetProps) {
  return (
    <div className={styles.group}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.facetContainer}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`${styles.facet} ${isSelected ? styles.selected : ''}`}
              onClick={() => onToggle(option)}
            >
              <span className={styles.optionLabel}>{option}</span>
              <span className={styles.count}>{counts?.[option] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
