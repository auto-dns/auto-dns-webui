import classNames from 'classnames';
import { SortState, SortCriterion, Filters, FacetCounts } from '../../types';
import SortChips from '../SortChips/SortChips';
import FilterPanel from '../FilterPanel/FilterPanel';
import styles from './FilterSortDrawer.module.scss';

interface Props {
  show: boolean;
  onClose: () => void;
  sort: SortState;
  onSortChange: (next: SortState) => void;
  availableSortFields: SortCriterion['key'][];
  filters: Filters;
  onFilterChange: (next: Filters) => void;
  availableRecordTypes: string[];
  availableRecordValues: string[];
  availableHostnames: string[];
  availableForce: boolean[];
  facetCounts: FacetCounts;
}

export default function FilterSortDrawer({
  show,
  onClose,
  sort,
  onSortChange,
  availableSortFields,
  filters,
  onFilterChange,
  availableRecordTypes,
  availableRecordValues,
  availableHostnames,
  availableForce,
  facetCounts,
}: Props) {
  return (
    <div
      className={classNames(styles.drawer,
        { [styles.show]: show },
        { [styles.hidden]: !show }
      )}
      id="filterDrawer"
    >
      <div className={styles.header}>
        <h2>Sorting & Filtering</h2>
        <button onClick={onClose}>×</button>
      </div>
      <div className={styles.content}>
        <div className={styles.section}>
          <h3>Sort</h3>
          <SortChips
            sort={sort}
            onChange={onSortChange}
            availableFields={availableSortFields}
          />
        </div>
        <div className={styles.section}>
          <h3>Filter</h3>
          <FilterPanel
            filters={filters}
            onChange={onFilterChange}
            availableRecordTypes={availableRecordTypes}
            availableRecordValues={availableRecordValues}
            availableHostnames={availableHostnames}
            availableForce={availableForce}
            facetCounts={facetCounts}
          />
        </div>
      </div>
    </div>
  );
}
