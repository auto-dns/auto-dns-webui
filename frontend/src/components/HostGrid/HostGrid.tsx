import HostCard from '../HostCard/HostCard';
import { HostSummary } from '../../types';
import { getHostKey } from '../../utils/host';
import styles from './HostGrid.module.scss';

interface HostGridProps {
  hosts: HostSummary[];
  onSelect: (host: HostSummary) => void;
}

export default function HostGrid({ hosts, onSelect }: HostGridProps) {
  if (hosts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hosts match your search.</p>
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
