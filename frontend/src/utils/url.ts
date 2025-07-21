import { Filters, SortState } from '../types';

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
  
  // Add sort
  if (sort.length > 0) {
    const sortString = sort.map(s => `${s.key}:${s.ascending ? 'asc' : 'desc'}`).join(',');
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
  let sort: SortState = [{ key: 'dnsRecord.name', ascending: true }]; // default
  
  if (sortParam) {
    try {
      sort = sortParam.split(',').map(item => {
        const [key, direction] = item.split(':');
        return {
          key: key as any, // Type assertion - we'll validate this is a valid SortKey
          ascending: direction === 'asc'
        };
      }).filter(item => 
        // Validate that key is a valid SortKey
        ['dnsRecord.name', 'dnsRecord.type', 'dnsRecord.value', 'metadata.containerName', 'metadata.created', 'metadata.hostname'].includes(item.key)
      );
      
      // If no valid sort criteria, use default
      if (sort.length === 0) {
        sort = [{ key: 'dnsRecord.name', ascending: true }];
      }
    } catch {
      // If parsing fails, use default
      sort = [{ key: 'dnsRecord.name', ascending: true }];
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