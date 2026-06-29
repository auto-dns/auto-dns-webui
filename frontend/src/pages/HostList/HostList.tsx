import { useCallback, useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar';
import HostGrid from '../../components/HostGrid/HostGrid';
import StatusBar from '../../components/StatusBar/StatusBar';
import { useHosts } from '../../hooks/useHosts';
import { filterHosts } from '../../utils/host';
import styles from './HostList.module.scss';

export default function HostList() {
  const { hosts, loading, error, lastUpdated, status, refresh } = useHosts();
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const filteredHosts = useMemo(() => filterHosts(hosts, search), [hosts, search]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const updated = new Set(prev);
      updated.has(key) ? updated.delete(key) : updated.add(key);
      return updated;
    });
  }, []);

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
        <HostGrid hosts={filteredHosts} expandedKeys={expandedKeys} toggleExpand={toggleExpand} />
      )}
    </div>
  );
}
