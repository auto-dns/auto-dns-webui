import { Filters, SortState, SortKey } from '../types';

// URL parameter keys
const PARAM_KEYS = {
  search: 'q',
  // Filters
  name: 'name',
  type: 'type',
  value: 'value',
  containerId: 'cid',
  containerName: 'cname',
  hostname: 'hostname',
  force: 'force',
  // Sort
  sort: 'sort',
} as const;

// Friendly names for sort keys (for URL parameters)
const SORT_FRIENDLY_NAMES: Record<SortKey, string> = {
  'dnsRecord.name': 'name',
  'dnsRecord.type': 'type',
  'dnsRecord.value': 'value',
  'metadata.containerName': 'container',
  'metadata.created': 'created',
  'metadata.hostname': 'hostname',
};

// Reverse mapping from friendly names to full keys
const FRIENDLY_TO_SORT_KEY: Record<string, SortKey> = Object.fromEntries(
  Object.entries(SORT_FRIENDLY_NAMES).map(([key, friendly]) => [friendly, key as SortKey])
);

// Default sort configuration
const DEFAULT_SORT: SortState = [{ key: 'dnsRecord.name', ascending: true }];

// Check if the current sort state should be omitted from URL
function shouldOmitSortFromUrl(sort: SortState): boolean {
  // If there are multiple sorts, always include in URL
  if (sort.length > 1) {
    return false;
  }
  
  // If there's exactly one sort and it matches the default, omit it
  if (sort.length === 1) {
    const [firstSort] = sort;
    return firstSort.key === DEFAULT_SORT[0].key && firstSort.ascending === DEFAULT_SORT[0].ascending;
  }
  
  // If no sorts, omit from URL
  return true;
}

// Serialize state to URL parameters
export function serializeToUrl(search: string, filters: Filters, sort: SortState): string {
  const params = new URLSearchParams();
  
  // Add search
  if (search.trim()) {
    params.set(PARAM_KEYS.search, search.trim());
  }
  
  // Add filters
  if (filters.name.trim()) {
    params.set(PARAM_KEYS.name, filters.name.trim());
  }
  if (filters.type.length > 0) {
    params.set(PARAM_KEYS.type, filters.type.join(','));
  }
  if (filters.value.length > 0) {
    params.set(PARAM_KEYS.value, filters.value.join(','));
  }
  if (filters.containerId.trim()) {
    params.set(PARAM_KEYS.containerId, filters.containerId.trim());
  }
  if (filters.containerName.trim()) {
    params.set(PARAM_KEYS.containerName, filters.containerName.trim());
  }
  if (filters.hostname.length > 0) {
    params.set(PARAM_KEYS.hostname, filters.hostname.join(','));
  }
  if (filters.force.length > 0) {
    params.set(PARAM_KEYS.force, filters.force.map(f => f.toString()).join(','));
  }
  
  // Add sort (only if it should not be omitted)
  if (!shouldOmitSortFromUrl(sort)) {
    const sortString = sort.map(s => {
      const friendlyName = SORT_FRIENDLY_NAMES[s.key];
      return `${friendlyName}:${s.ascending ? 'asc' : 'desc'}`;
    }).join(',');
    params.set(PARAM_KEYS.sort, sortString);
  }
  
  return params.toString();
}

// Parse URL parameters to state
export function parseFromUrl(searchParams: URLSearchParams): {
  search: string;
  filters: Filters;
  sort: SortState;
} {
  // Parse search
  const search = searchParams.get(PARAM_KEYS.search) || '';
  
  // Parse filters
  const filters: Filters = {
    name: searchParams.get(PARAM_KEYS.name) || '',
    type: searchParams.get(PARAM_KEYS.type)?.split(',').filter(Boolean) || [],
    value: searchParams.get(PARAM_KEYS.value)?.split(',').filter(Boolean) || [],
    containerId: searchParams.get(PARAM_KEYS.containerId) || '',
    containerName: searchParams.get(PARAM_KEYS.containerName) || '',
    hostname: searchParams.get(PARAM_KEYS.hostname)?.split(',').filter(Boolean) || [],
    force: searchParams.get(PARAM_KEYS.force)?.split(',').filter(Boolean).map(f => f === 'true') || [],
  };
  
  // Parse sort
  const sortParam = searchParams.get(PARAM_KEYS.sort);
  let sort: SortState = [...DEFAULT_SORT]; // Use default
  
  if (sortParam) {
    try {
      const parsedSort = sortParam.split(',').map(item => {
        const [friendlyName, direction] = item.split(':');
        const fullKey = FRIENDLY_TO_SORT_KEY[friendlyName];
        if (!fullKey) {
          throw new Error(`Invalid sort key: ${friendlyName}`);
        }
        return {
          key: fullKey,
          ascending: direction === 'asc'
        };
      }).filter(item => 
        // Validate that key is a valid SortKey
        Object.keys(SORT_FRIENDLY_NAMES).includes(item.key)
      );
      
      // If we got valid sort criteria, use them
      if (parsedSort.length > 0) {
        sort = parsedSort;
      }
    } catch {
      // If parsing fails, use default
      sort = [...DEFAULT_SORT];
    }
  }
  
  return { search, filters, sort };
}

// Update URL without page reload
export function updateUrl(search: string, filters: Filters, sort: SortState, replace = false): void {
  const queryString = serializeToUrl(search, filters, sort);
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  
  if (replace) {
    window.history.replaceState(null, '', newUrl);
  } else {
    window.history.pushState(null, '', newUrl);
  }
} 