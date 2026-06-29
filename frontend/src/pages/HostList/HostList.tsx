import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar';
import HostGrid from '../../components/HostGrid/HostGrid';
import HostModal from '../../components/HostModal/HostModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import { useHosts } from '../../hooks/useHosts';
import { filterHosts } from '../../utils/host';
import styles from './HostList.module.scss';

// The host search and the open host are persisted in the URL under their own
// keys (so they don't collide with the record list's `q`/`record`), which makes
// them survive reloads and shareable.
const HOST_SEARCH_PARAM = 'hq';
const HOST_SELECTED_PARAM = 'host';

function paramFromUrl(key: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) || '';
}

export default function HostList() {
  const { hosts, loading, error, lastUpdated, status, refresh } = useHosts();
  const [search, setSearch] = useState(() => paramFromUrl(HOST_SEARCH_PARAM));
  const [activeHostKey, setActiveHostKey] = useState<string | null>(
    () => paramFromUrl(HOST_SELECTED_PARAM) || null,
  );

  const deferredSearch = useDeferredValue(search);
  const filteredHosts = useMemo(() => filterHosts(hosts, deferredSearch), [hosts, deferredSearch]);
  // Resolve the open host from its key once hosts are loaded (so a deep-linked
  // modal opens after the initial fetch resolves).
  const activeHost = useMemo(
    () => hosts.find((h) => h.hostname === activeHostKey) ?? null,
    [hosts, activeHostKey],
  );

  // Reflect search + open host in the URL (replace, so typing doesn't spam
  // history), preserving any other params such as `view`.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set(HOST_SEARCH_PARAM, search.trim());
    } else {
      params.delete(HOST_SEARCH_PARAM);
    }
    if (activeHostKey) {
      params.set(HOST_SELECTED_PARAM, activeHostKey);
    } else {
      params.delete(HOST_SELECTED_PARAM);
    }
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [search, activeHostKey]);

  // Keep state in sync with back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      setSearch(paramFromUrl(HOST_SEARCH_PARAM));
      setActiveHostKey(paramFromUrl(HOST_SELECTED_PARAM) || null);
    };
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
          onSelect={(host) => setActiveHostKey(host.hostname)}
          canReset={search.trim().length > 0}
          onReset={() => setSearch('')}
        />
      )}
      {activeHost && <HostModal host={activeHost} onClose={() => setActiveHostKey(null)} />}
    </div>
  );
}
