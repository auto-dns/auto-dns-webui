import HostCard from '../HostCard/HostCard';
import { HostSummary } from '../../types';
import { getHostKey } from '../../utils/host';
import styles from './HostGrid.module.scss';

interface HostGridProps {
  hosts: HostSummary[];
  onSelect: (host: HostSummary) => void;
  // When true, the empty state offers a reset action (a search is the likely
  // reason nothing matched).
  canReset?: boolean;
  onReset?: () => void;
}

export default function HostGrid({ hosts, onSelect, canReset, onReset }: HostGridProps) {
  if (hosts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hosts match your search.</p>
        {canReset && onReset && (
          <button type="button" className={styles.resetButton} onClick={onReset}>
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {hosts.map((host) => (
        <HostCard key={getHostKey(host)} host={host} onSelect={onSelect} />
      ))}
    </div>
  );
}
