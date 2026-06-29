import classNames from 'classnames';
import { HostSummary } from '../../types';
import { formatTypeCounts } from '../../utils/host';
import { formatRelativeTime } from '../../utils/time';
import Modal from '../Modal/Modal';
import styles from './HostModal.module.scss';

interface HostModalProps {
  host: HostSummary;
  onClose: () => void;
}

export default function HostModal({ host, onClose }: HostModalProps) {
  const typeSummary = formatTypeCounts(host.typeCounts);

  return (
    <Modal onClose={onClose} labelledBy="host-modal-title">
      <div className={styles.header}>
        <h2 id="host-modal-title" className={styles.name}>
          {host.hostname || '(unknown)'}
        </h2>
        <span
          className={classNames(styles.status, host.online ? styles.online : styles.offline)}
          title={host.online ? 'Heartbeat present' : 'No heartbeat'}
        >
          <span className={styles.dot} aria-hidden="true" />
          {host.online ? 'Online' : 'Offline'}
        </span>
      </div>

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Records</dt>
          <dd>{host.recordCount}</dd>
        </div>
        <div className={styles.row}>
          <dt>Types</dt>
          <dd>{typeSummary || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Containers</dt>
          <dd>{host.containers.length}</dd>
        </div>
        <div className={styles.row}>
          <dt>Last published</dt>
          <dd>
            {host.lastPublished ? (
              <span title={new Date(host.lastPublished).toLocaleString()}>
                {formatRelativeTime(new Date(host.lastPublished))}
              </span>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      {host.containers.length > 0 && (
        <div className={styles.containers}>
          <h3 className={styles.sectionLabel}>Containers</h3>
          <ul className={styles.containerList}>
            {host.containers.map((c) => (
              <li key={c.containerId || c.containerName} className={styles.containerItem}>
                <span className={styles.containerName}>{c.containerName || '(unnamed)'}</span>
                <span className={styles.containerCount}>
                  {c.recordCount} record{c.recordCount === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
