import HostCard from '../HostCard/HostCard';
import { HostSummary } from '../../types';
import { getHostKey } from '../../utils/host';
import styles from './HostGrid.module.scss';

interface HostGridProps {
  hosts: HostSummary[];
  expandedKeys: Set<string>;
  toggleExpand: (key: string) => void;
}

export default function HostGrid({ hosts, expandedKeys, toggleExpand }: HostGridProps) {
  if (hosts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hosts match your search.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {hosts.map((host) => {
        const key = getHostKey(host);
        return (
          <HostCard
            key={key}
            host={host}
            isExpanded={expandedKeys.has(key)}
            toggleExpand={toggleExpand}
          />
        );
      })}
    </div>
  );
}
