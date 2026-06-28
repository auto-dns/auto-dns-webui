import { useCallback, useEffect, useRef, useState } from 'react';
import { RecordEntry } from '../types';

// Connection status surfaced to the UI:
// - 'connecting': the live stream is being (re)established
// - 'live':       receiving server-pushed updates over SSE
// - 'polling':    SSE is unavailable; falling back to interval polling
export type ConnectionStatus = 'connecting' | 'live' | 'polling';

// How often the polling fallback re-fetches when the live stream is down.
const POLL_INTERVAL_MS = 15_000;

// If the open stream delivers nothing (no `records` update and no `ping`
// heartbeat) within this window, treat it as stalled and fall back to polling.
// Must exceed the server's heartbeat interval (25s) with margin so a healthy but
// idle stream is never mistaken for a dead one.
const STALL_TIMEOUT_MS = 40_000;

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
// to interval polling of `/api/records` when EventSource is unavailable, the
// stream errors, or the stream opens but goes silent (e.g. behind a buffering
// proxy). Updates pause while the tab is hidden and catch up on return.
export function useRecords(): UseRecordsResult {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stallRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Fetch immediately so the list catches up without waiting a full interval;
    // the interval handles subsequent refreshes (skipped while the tab is hidden).
    void fetchRecords(false);
    pollRef.current = setInterval(() => {
      if (!document.hidden) {
        void fetchRecords(false);
      }
    }, POLL_INTERVAL_MS);
  }, [fetchRecords]);

  const clearStall = useCallback(() => {
    if (stallRef.current !== null) {
      clearTimeout(stallRef.current);
      stallRef.current = null;
    }
  }, []);

  // (Re)open the SSE stream, falling back to polling if it can't be used. The
  // stream is only considered "live" once it actually delivers something, so a
  // connection that opens but stays silent falls back via the stall watchdog
  // while polling keeps the data fresh in the meantime.
  const connect = useCallback(() => {
    if (typeof EventSource === 'undefined') {
      startPolling();
      return;
    }
    esRef.current?.close();
    setStatus('connecting');

    const es = new EventSource('/api/records/stream');
    esRef.current = es;

    // Re-arm the stall watchdog: if nothing arrives within the timeout, the
    // stream is treated as dead and we fall back to polling.
    const armStall = () => {
      clearStall();
      stallRef.current = setTimeout(() => {
        esRef.current?.close();
        esRef.current = null;
        startPolling();
      }, STALL_TIMEOUT_MS);
    };

    // Any traffic (a snapshot or a heartbeat) proves the stream is flowing:
    // mark it live, stop the polling fallback, and reset the watchdog.
    const onTraffic = () => {
      setStatus('live');
      stopPolling();
      armStall();
    };

    es.addEventListener('records', (ev) => {
      onTraffic();
      try {
        const data = JSON.parse((ev as MessageEvent).data) as RecordEntry[];
        applySnapshot(data);
      } catch (err) {
        console.error('Failed to parse stream payload:', err);
      }
    });

    es.addEventListener('ping', onTraffic);

    es.onerror = () => {
      // EventSource retries on its own while readyState === CONNECTING; only a
      // fully closed stream means we should fall back to polling immediately.
      if (es.readyState === EventSource.CLOSED) {
        clearStall();
        startPolling();
      } else {
        setStatus('connecting');
      }
    };

    armStall();
  }, [applySnapshot, clearStall, startPolling, stopPolling]);

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
      clearStall();
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
        clearStall();
      } else {
        // connect() replays the current snapshot over SSE (or starts polling,
        // which fetches immediately), so no separate catch-up fetch is needed.
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [connect, clearStall, stopPolling]);

  return { records, loading, error, lastUpdated, status, refresh };
}
