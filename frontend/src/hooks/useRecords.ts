import { useCallback, useEffect, useRef, useState } from 'react';
import { RecordEntry } from '../types';

// Connection status surfaced to the UI:
// - 'connecting': the live stream is being (re)established
// - 'live':       receiving server-pushed updates over SSE
// - 'polling':    SSE is unavailable; falling back to interval polling
export type ConnectionStatus = 'connecting' | 'live' | 'polling';

// How often the polling fallback re-fetches when the live stream is down.
const POLL_INTERVAL_MS = 15_000;

export interface UseRecordsResult {
  records: RecordEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  status: ConnectionStatus;
  refresh: () => void;
}

// useRecords loads the DNS record set and keeps it live. It prefers a
// server-pushed SSE stream (`/api/records/stream`) and transparently falls back
// to interval polling of `/api/records` when EventSource is unavailable or the
// stream fails. Updates pause while the tab is hidden and catch up on return.
export function useRecords(): UseRecordsResult {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply a fresh snapshot from any source (fetch or stream).
  const applySnapshot = useCallback((data: RecordEntry[]) => {
    setRecords(data);
    setLastUpdated(new Date());
    setError(null);
    setLoading(false);
  }, []);

  // One-shot fetch of the full record set. `showLoading` drives the page-level
  // loading/error states (initial load and manual refresh); background polling
  // passes false so a transient blip doesn't blank the list.
  const fetchRecords = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch('/api/records');
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as RecordEntry[];
        applySnapshot(data);
      } catch (err) {
        console.error('Failed to fetch records:', err);
        if (showLoading) {
          setError('Failed to load DNS records. Please try again.');
          setLoading(false);
        }
      }
    },
    [applySnapshot],
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current !== null) return;
    setStatus('polling');
    pollRef.current = setInterval(() => {
      if (!document.hidden) {
        void fetchRecords(false);
      }
    }, POLL_INTERVAL_MS);
  }, [fetchRecords]);

  // (Re)open the SSE stream, falling back to polling if it can't be used.
  const connect = useCallback(() => {
    if (typeof EventSource === 'undefined') {
      startPolling();
      return;
    }
    esRef.current?.close();
    setStatus('connecting');

    const es = new EventSource('/api/records/stream');
    esRef.current = es;

    es.addEventListener('records', (ev) => {
      stopPolling();
      setStatus('live');
      try {
        const data = JSON.parse((ev as MessageEvent).data) as RecordEntry[];
        applySnapshot(data);
      } catch (err) {
        console.error('Failed to parse stream payload:', err);
      }
    });

    es.onopen = () => {
      stopPolling();
      setStatus('live');
    };

    es.onerror = () => {
      // EventSource retries on its own while readyState === CONNECTING; only a
      // fully closed stream means we should fall back to polling.
      if (es.readyState === EventSource.CLOSED) {
        startPolling();
      } else {
        setStatus('connecting');
      }
    };
  }, [applySnapshot, startPolling, stopPolling]);

  // Manual refresh: immediate fetch regardless of the active transport.
  const refresh = useCallback(() => {
    void fetchRecords(true);
  }, [fetchRecords]);

  // Initial load + stream setup.
  useEffect(() => {
    void fetchRecords(true);
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      stopPolling();
    };
    // Run once on mount; the callbacks are stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause while the tab is hidden; resume and catch up when it becomes visible.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        esRef.current?.close();
        esRef.current = null;
        stopPolling();
      } else {
        void fetchRecords(false);
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [connect, fetchRecords, stopPolling]);

  return { records, loading, error, lastUpdated, status, refresh };
}
