import { HostSummary } from '../types';

// getHostKey returns a stable identity for a host row (hostnames are unique
// across the aggregated set).
export const getHostKey = (host: HostSummary) => host.hostname;

// filterHosts narrows the host list by a free-text query matched against the
// hostname and the names of the containers publishing from it.
export function filterHosts(hosts: HostSummary[], search: string): HostSummary[] {
  const q = search.trim().toLowerCase();
  if (!q) return hosts;
  return hosts.filter(
    (h) =>
      h.hostname.toLowerCase().includes(q) ||
      h.containers.some((c) => c.containerName.toLowerCase().includes(q)),
  );
}

// formatTypeCounts renders a host's per-type record breakdown as a compact,
// deterministically-ordered string, e.g. "A 3 · AAAA 1 · CNAME 2".
export function formatTypeCounts(typeCounts: Record<string, number>): string {
  return Object.keys(typeCounts)
    .sort()
    .map((type) => `${type} ${typeCounts[type]}`)
    .join(' · ');
}
