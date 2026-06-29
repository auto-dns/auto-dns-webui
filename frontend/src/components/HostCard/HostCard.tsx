import { Fragment } from 'react';
import classNames from 'classnames';
import { HostSummary } from '../../types';
import { formatTypeCounts } from '../../utils/host';
import { formatRelativeTime } from '../../utils/time';
import styles from './HostCard.module.scss';

interface HostCardProps {
  host: HostSummary;
  isExpanded: boolean;
  toggleExpand: (key: string) => void;
}

export default function HostCard({ host, isExpanded, toggleExpand }: HostCardProps) {
  const typeSummary = formatTypeCounts(host.typeCounts);

  return (
    <div className={styles.card} onClick={() => toggleExpand(host.hostname)}>
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

      <div className={styles.details}>
        <table>
          <tbody>
            <tr>
              <td>Records</td>
              <td>{host.recordCount}</td>
            </tr>
            <tr>
              <td>Types</td>
              <td>{typeSummary || '—'}</td>
            </tr>
            <tr>
              <td>Containers</td>
              <td>{host.containers.length}</td>
            </tr>
            <tr>
              <td>Last published</td>
              <td>
                {host.lastPublished ? (
                  <span title={new Date(host.lastPublished).toLocaleString()}>
                    {formatRelativeTime(new Date(host.lastPublished))}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
            {isExpanded && host.containers.length > 0 && (
              <Fragment>
                <tr>
                  <td colSpan={2} className={styles.sectionLabel}>
                    Containers
                  </td>
                </tr>
                {host.containers.map((c) => (
                  <tr key={c.containerId || c.containerName}>
                    <td>{c.containerName || '(unnamed)'}</td>
                    <td>
                      {c.recordCount} record{c.recordCount === 1 ? '' : 's'}
                    </td>
                  </tr>
                ))}
              </Fragment>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
