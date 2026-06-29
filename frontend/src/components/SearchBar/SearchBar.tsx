import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <Search className={styles.icon} size={16} aria-hidden="true" />
      <input
        type="text"
        className={styles.input}
        placeholder="Search all fields…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search records"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
