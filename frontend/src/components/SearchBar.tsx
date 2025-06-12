interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      className="search-input"
      placeholder="Search all fields..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
