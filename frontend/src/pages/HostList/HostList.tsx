import { useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar';
import HostGrid from '../../components/HostGrid/HostGrid';
import HostModal from '../../components/HostModal/HostModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import { useHosts } from '../../hooks/useHosts';
import { filterHosts } from '../../utils/host';
import { HostSummary } from '../../types';
import styles from './HostList.module.scss';

export default function HostList() {
  const { hosts, loading, error, lastUpdated, status, refresh } = useHosts();
  const [search, setSearch] = useState('');
  const [activeHost, setActiveHost] = useState<HostSummary | null>(null);

  const filteredHosts = useMemo(() => filterHosts(hosts, search), [hosts, search]);

  return (
    <div className={styles.hostList}>
      <header className={styles.stickyHeader}>
        <div className={styles.searchWrapper}>
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>
      <h2 className={styles.pageTitle}>Hosts</h2>
      {!loading && !error && (
        <StatusBar status={status} lastUpdated={lastUpdated} onRefresh={refresh} />
      )}
      {loading ? (
        <div className={styles.statusMessage} role="status" aria-live="polite">
          Loading hosts…
        </div>
      ) : error ? (
        <div className={styles.statusMessage} role="alert">
          <p>{error}</p>
          <button className={styles.retryButton} onClick={refresh}>
            Retry
          </button>
        </div>
      ) : (
        <HostGrid hosts={filteredHosts} onSelect={setActiveHost} />
      )}
      {activeHost && <HostModal host={activeHost} onClose={() => setActiveHost(null)} />}
    </div>
  );
}
