import { useDeferredValue, useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar';
import HostGrid from '../../components/HostGrid/HostGrid';
import HostModal from '../../components/HostModal/HostModal';
import StatusBar from '../../components/StatusBar/StatusBar';
import ListStatus from '../../components/ListStatus/ListStatus';
import { useHosts } from '../../hooks/useHosts';
import { useUrlSync } from '../../hooks/useUrlSync';
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

  // Build the full query for this view (keep `view=hosts`, drop any stale
  // record-list params), then sync it to the URL via the shared hook.
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('view', 'hosts');
    if (search.trim()) params.set(HOST_SEARCH_PARAM, search.trim());
    if (activeHostKey) params.set(HOST_SELECTED_PARAM, activeHostKey);
    return params.toString();
  }, [search, activeHostKey]);
  useUrlSync(queryString, () => {
    setSearch(paramFromUrl(HOST_SEARCH_PARAM));
    setActiveHostKey(paramFromUrl(HOST_SELECTED_PARAM) || null);
  });

  const deferredSearch = useDeferredValue(search);
  const filteredHosts = useMemo(() => filterHosts(hosts, deferredSearch), [hosts, deferredSearch]);
  // Resolve the open host from its key once hosts are loaded (so a deep-linked
  // modal opens after the initial fetch resolves).
  const activeHost = useMemo(
    () => hosts.find((h) => h.hostname === activeHostKey) ?? null,
    [hosts, activeHostKey],
  );

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
      {loading || error ? (
        <ListStatus
          loading={loading}
          error={error}
          loadingLabel="Loading hosts…"
          onRetry={refresh}
        />
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
