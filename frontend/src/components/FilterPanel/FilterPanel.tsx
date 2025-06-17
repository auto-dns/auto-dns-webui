import { Filters, FacetCounts } from '../../types';
import StyledFacet from '../StyledFacet/StyledFacet';
import styles from './FilterPanel.module.scss';

interface FilterPanelProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  availableRecordTypes: string[];
  availableRecordValues: string[];
  availableHostnames: string[];
  availableForce: boolean[];
  facetCounts: FacetCounts;
}

export default function FilterPanel({
  filters,
  onChange,
  availableRecordTypes,
  availableRecordValues,
  availableHostnames,
  availableForce,
  facetCounts,
}: FilterPanelProps) {
  const toggleString = (field: keyof Filters, value: string) => {
    const current = filters[field] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  };

  const toggleBool = (field: keyof Filters, value: boolean) => {
    const current = filters[field] as boolean[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  };

  return (
    <div>
      <div className={styles.group}>
        <label htmlFor='record-name-input'>
          Record Name:
          <input
            type="text"
            id="record-name-input"
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.group}>
        <StyledFacet
          label="Record Type"
          options={availableRecordTypes}
          selected={filters.type}
          onToggle={(val) => toggleString('type', val)}
          counts={facetCounts.type}
        />
      </div>

      <div className={styles.group}>
        <StyledFacet
          label="Record Value"
          options={availableRecordValues}
          selected={filters.value}
          onToggle={(val) => toggleString('value', val)}
          counts={facetCounts.value}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor='container-name-input'>
          Container Name:
          <input
            type="text"
            id="container-name-input"
            value={filters.containerName}
            onChange={(e) =>
              onChange({ ...filters, containerName: e.target.value })
            }
          />
        </label>
      </div>

      <div className={styles.group}>
        <label htmlFor='container-id-input'>
          Container Id:
          <input
            type="text"
            id="container-id-input"
            value={filters.containerId}
            onChange={(e) =>
              onChange({ ...filters, containerId: e.target.value })
            }
          />
        </label>
      </div>

      <div className={styles.group}>
        <StyledFacet
          label="Hostname"
          options={availableHostnames}
          selected={filters.hostname}
          onToggle={(val) => toggleString('hostname', val)}
          counts={facetCounts.hostname}
        />
      </div>

      <div className={styles.group}>
        <StyledFacet
          label="Force"
          options={availableForce.map((f) => f.toString())}
          selected={filters.force.map((f) => f.toString())}
          onToggle={(val) => toggleBool('force', val === 'true')}
          counts={facetCounts.force}
        />
      </div>
    </div>
  );
}
