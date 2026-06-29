import { useCallback, useEffect, useRef, useState } from 'react';
import { HostSummary } from '../types';
import type { ConnectionStatus } from './useRecords';

// How often the host summary is re-fetched. Host liveness comes from the
// producer's lease-backed heartbeat keys (default 30s TTL), so a 15s poll keeps
// online/offline state reasonably fresh without hammering the backend.
const POLL_INTERVAL_MS = 15_000;

export interface UseHostsResult {
  hosts: HostSummary[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  status: ConnectionStatus;
  refresh: () => void;
}

// useHosts loads the per-host summary from `/api/hosts` and keeps it current by
// polling. Unlike the record list there is no server-push stream for hosts —
// heartbeat presence isn't part of the record watch — so this polls on an
// interval, pausing while the tab is hidden and catching up on return.
export function useHosts(): UseHostsResult {
  const [hosts, setHosts] = useState<HostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // One-shot fetch. `showLoading` drives the page-level loading/error states
  // (initial load and manual refresh); background polling passes false so a
  // transient blip doesn't blank the list.
  const fetchHosts = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch('/api/hosts');
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as HostSummary[];
      setHosts(data);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
      setStatus('polling');
    } catch (err) {
      console.error('Failed to fetch hosts:', err);
      if (showLoading) {
        setError('Failed to load hosts. Please try again.');
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchHosts(true);
  }, [fetchHosts]);

  useEffect(() => {
    const stop = () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    const start = () => {
      if (pollRef.current !== null) return;
      pollRef.current = setInterval(() => {
        if (!document.hidden) {
          void fetchHosts(false);
        }
      }, POLL_INTERVAL_MS);
    };

    void fetchHosts(true);
    start();

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void fetchHosts(false);
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // Run once on mount; fetchHosts is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hosts, loading, error, lastUpdated, status, refresh };
}
