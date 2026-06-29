import styles from './ListStatus.module.scss';

interface ListStatusProps {
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  onRetry: () => void;
}

// Shared loading / error-with-retry message for the list pages. Render it only
// while loading or in error (the caller switches to the grid otherwise).
export default function ListStatus({ loading, error, loadingLabel, onRetry }: ListStatusProps) {
  if (loading) {
    return (
      <div className={styles.statusMessage} role="status" aria-live="polite">
        {loadingLabel}
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.statusMessage} role="alert">
        <p>{error}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return null;
}
