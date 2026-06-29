import classNames from 'classnames';
import { HostSummary } from '../../types';
import { formatTypeCounts } from '../../utils/host';
import styles from './HostCard.module.scss';

interface HostCardProps {
  host: HostSummary;
  onSelect: (host: HostSummary) => void;
}

export default function HostCard({ host, onSelect }: HostCardProps) {
  const typeSummary = formatTypeCounts(host.typeCounts);

  return (
    <div
      className={styles.card}
      onClick={() => onSelect(host)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(host);
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.name}>{host.hostname || '(unknown)'}</span>
        <span
          className={classNames(styles.status, host.online ? styles.online : styles.offline)}
          title={host.online ? 'Heartbeat present' : 'No heartbeat'}
        >
          <span className={styles.dot} aria-hidden="true" />
          {host.online ? 'Online' : 'Offline'}
        </span>
      </div>

      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt>Records</dt>
          <dd>{host.recordCount}</dd>
        </div>
        <div className={styles.row}>
          <dt>Types</dt>
          <dd>{typeSummary || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
