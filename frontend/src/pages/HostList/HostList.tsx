import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar';
import HostGrid from '../../components/HostGrid/HostGrid';
import HostModal from '../../components/HostModal/HostModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import { useHosts } from '../../hooks/useHosts';
import { filterHosts } from '../../utils/host';
import { HostSummary } from '../../types';
import styles from './HostList.module.scss';

// The host search is persisted in the URL under its own key so it doesn't
// collide with the record list's `q`, and survives reloads / is shareable.
const HOST_SEARCH_PARAM = 'hq';

function hostSearchFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(HOST_SEARCH_PARAM) || '';
}

export default function HostList() {
  const { hosts, loading, error, lastUpdated, status, refresh } = useHosts();
  const [search, setSearch] = useState(hostSearchFromUrl);
  const [activeHost, setActiveHost] = useState<HostSummary | null>(null);

  const filteredHosts = useMemo(() => filterHosts(hosts, search), [hosts, search]);

  // Reflect the search in the URL (replace, not push, so typing doesn't spam
  // history), preserving any other params such as `view`.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set(HOST_SEARCH_PARAM, search.trim());
    } else {
      params.delete(HOST_SEARCH_PARAM);
    }
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [search]);

  // Keep search in sync with back/forward navigation.
  useEffect(() => {
    const onPopState = () => setSearch(hostSearchFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
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
        <StatusBar
          status={status}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          shown={filteredHosts.length}
          total={hosts.length}
          noun={hosts.length === 1 ? 'host' : 'hosts'}
        />
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
        <HostGrid
          hosts={filteredHosts}
          onSelect={setActiveHost}
          canReset={search.trim().length > 0}
          onReset={() => setSearch('')}
        />
      )}
      {activeHost && <HostModal host={activeHost} onClose={() => setActiveHost(null)} />}
    </div>
  );
}
