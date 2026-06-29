import { useEffect, useRef } from 'react';

// useUrlSync keeps the URL query string in sync with incidental view state
// (search, filters, sort, the open detail item) WITHOUT growing browser
// history: writes use replaceState, so typing, filtering, and opening/closing a
// modal don't each leave a history entry (which previously made Back unusable
// and could re-open a just-closed modal). Changes that arrive via Back/Forward
// are applied back into state through `applyFromUrl`, and flagged so the write
// effect doesn't immediately echo them out again.
//
// `queryString` is the already-serialized query for the current state (without
// the leading "?"). Each page owns its own serialization, so this hook only
// encodes the shared, drift-prone mechanism — not the URL shape.
export function useUrlSync(queryString: string, applyFromUrl: () => void): void {
  const fromPopState = useRef(false);
  const applyRef = useRef(applyFromUrl);
  applyRef.current = applyFromUrl;

  useEffect(() => {
    if (fromPopState.current) {
      // This queryString change originated from a popstate-driven state update;
      // don't write it back out (it's already the current URL).
      fromPopState.current = false;
      return;
    }
    const url = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [queryString]);

  useEffect(() => {
    const onPopState = () => {
      fromPopState.current = true;
      applyRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
