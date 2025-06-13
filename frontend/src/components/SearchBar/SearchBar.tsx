import styles from './SearchBar.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        className={styles.input}
        placeholder="Search all fields..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
