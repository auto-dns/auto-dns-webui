import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import classNames from 'classnames';
import { ConnectionStatus } from '../../hooks/useRecords';
import { formatRelativeTime } from '../../utils/time';
import styles from './StatusBar.module.scss';

interface StatusBarProps {
  status: ConnectionStatus;
  lastUpdated: Date | null;
  onRefresh: () => void;
  // Optional result count: number shown after filtering vs. the total.
  shown?: number;
  total?: number;
  noun?: string;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  polling: 'Polling',
};

// How often the relative "updated Xs ago" label is recomputed.
const TICK_MS = 10_000;

export default function StatusBar({
  status,
  lastUpdated,
  onRefresh,
  shown,
  total,
  noun = 'items',
}: StatusBarProps) {
  // Re-render periodically so the relative timestamp stays current even when
  // no new data has arrived.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const showCount = typeof shown === 'number' && typeof total === 'number';

  return (
    <div className={styles.statusBar}>
      {showCount && (
        <span className={styles.count}>
          {shown === total ? (
            <>
              <strong>{total}</strong> {noun}
            </>
          ) : (
            <>
              <strong>{shown}</strong> of {total} {noun}
            </>
          )}
        </span>
      )}
      <span
        className={classNames(styles.indicator, styles[status])}
        role="status"
        aria-live="polite"
        title={`Updates: ${STATUS_LABEL[status]}`}
      >
        <span className={styles.dot} aria-hidden="true" />
        {STATUS_LABEL[status]}
      </span>
      {lastUpdated && (
        <span className={styles.updated} title={lastUpdated.toLocaleString()}>
          Updated {formatRelativeTime(lastUpdated)}
        </span>
      )}
      <button
        className={styles.refresh}
        onClick={onRefresh}
        aria-label="Refresh records"
        title="Refresh records"
      >
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  );
}
