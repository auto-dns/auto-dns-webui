import classNames from 'classnames';
import styles from './FilterSortDrawer.module.scss';
import { Filters } from '../../types';
import FilterPanel from '../FilterPanel/FilterPanel';

interface Props {
  show: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (next: Filters) => void;
  availableRecordTypes: string[];
  availableRecordValues: string[];
  availableHostnames: string[];
  availableForce: boolean[];
}

export default function FilterSortDrawer({
  show,
  onClose,
  filters,
  onChange,
  availableRecordTypes,
  availableRecordValues,
  availableHostnames,
  availableForce,
}: Props) {
  return (
    <div
      className={classNames(
        styles.drawer,
        { [styles.show]: show },
        { [styles.hidden]: !show }
      )}
      id="filterDrawer"
    >
      <div className={styles.header}>
        <h2>Filters</h2>
        <button onClick={onClose}>×</button>
      </div>
      <FilterPanel
        filters={filters}
        onChange={onChange}
        availableRecordTypes={availableRecordTypes}
        availableRecordValues={availableRecordValues}
        availableHostnames={availableHostnames}
        availableForce={availableForce}
      />
    </div>
  );
}
