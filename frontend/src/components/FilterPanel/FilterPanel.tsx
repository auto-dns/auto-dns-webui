import { Filters } from '../../types';
import { capitalizeFirstLetter } from '../../utils/text';
import styles from './FilterPanel.module.scss';

interface FilterPanelProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  availableRecordTypes: string[];
  availableRecordValues: string[];
  availableHostnames: string[];
  availableForce: boolean[];
}

export default function FilterPanel({ filters, onChange, availableRecordTypes, availableRecordValues, availableHostnames, availableForce }: FilterPanelProps) {
  function toggleString(field: keyof Filters, value: string) {
    const current = filters[field] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  }

  function toggleBool(field: keyof Filters, value: boolean) {
    const current = filters[field] as boolean[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.group}>
        <label>
          Record Name:
          <input
            type="text"
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.group}>
        <fieldset>
          <legend>Record Type</legend>
          <div className={styles.checkboxList}>
            {availableRecordTypes.map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={filters.type.includes(type)}
                  onChange={() => toggleString('type', type)}
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.group}>
        <fieldset>
          <legend>Record Value</legend>
          <div className={styles.checkboxList}>
            {availableRecordValues.map((value) => (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={filters.type.includes(value)}
                  onChange={() => toggleString('value', value)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.group}>
        <label>
          Container Name:
          <input
            type="text"
            value={filters.containerName}
            onChange={(e) => onChange({ ...filters, containerName: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.group}>
        <label>
          Container Id:
          <input
            type="text"
            value={filters.containerId}
            onChange={(e) => onChange({ ...filters, containerId: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.group}>
        <fieldset>
          <legend>Hostname</legend>
          <div className={styles.checkboxList}>
            {availableHostnames.map((hostname) => (
              <label key={hostname}>
                <input
                  type="checkbox"
                  checked={filters.hostname.includes(hostname)}
                  onChange={() => toggleString('hostname', hostname)}
                />
                {hostname}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.group}>
        <fieldset>
          <legend>Force</legend>
          <div className={styles.checkboxList}>
            {availableForce.map((force) => (
              <label key={availableForce.toString()}>
                <input
                  type="checkbox"
                  checked={filters.force.includes(force)}
                  onChange={() => toggleBool('force', force)}
                />
                {capitalizeFirstLetter(force.toString())}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}