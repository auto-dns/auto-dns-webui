import { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { List, Server } from 'lucide-react';
import RecordList from './pages/RecordList/RecordList';
import HostList from './pages/HostList/HostList';
import styles from './App.module.scss';

type View = 'records' | 'hosts';

// The active view is reflected in the URL (`?view=hosts`) so it survives reloads
// and is shareable, without pulling in a router dependency. Records is the
// default and omits the parameter to keep the record list's own URL state clean.
function viewFromLocation(): View {
  if (typeof window === 'undefined') return 'records';
  return new URLSearchParams(window.location.search).get('view') === 'hosts'
    ? 'hosts'
    : 'records';
}

export default function App() {
  const [view, setView] = useState<View>(viewFromLocation);

  useEffect(() => {
    const onPopState = () => setView(viewFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const changeView = useCallback(
    (next: View) => {
      if (next === view) return;
      const params = new URLSearchParams(window.location.search);
      if (next === 'hosts') {
        params.set('view', 'hosts');
      } else {
        // Returning to the record list drops the host params entirely; the
        // record list manages its own query string from here.
        params.delete('view');
      }
      const qs = params.toString();
      window.history.pushState(
        null,
        '',
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
      setView(next);
    },
    [view],
  );

  return (
    <div className={styles.app}>
      <nav className={styles.tabs} aria-label="Views">
        <button
          type="button"
          className={classNames(styles.tab, { [styles.active]: view === 'records' })}
          aria-current={view === 'records' ? 'page' : undefined}
          onClick={() => changeView('records')}
        >
          <List size={16} aria-hidden="true" />
          Records
        </button>
        <button
          type="button"
          className={classNames(styles.tab, { [styles.active]: view === 'hosts' })}
          aria-current={view === 'hosts' ? 'page' : undefined}
          onClick={() => changeView('hosts')}
        >
          <Server size={16} aria-hidden="true" />
          Hosts
        </button>
      </nav>
      <div className={styles.view}>{view === 'records' ? <RecordList /> : <HostList />}</div>
    </div>
  );
}
