// formatRelativeTime renders a short, human-friendly "time ago" string for the
// last-updated indicator (e.g. "just now", "12s ago", "3m ago", "2h ago").
export function formatRelativeTime(from: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - from.getTime()) / 1000);
  // Covers future timestamps (negative) too.
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
