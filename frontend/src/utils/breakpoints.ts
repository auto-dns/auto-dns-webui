// Keep these values in sync with _variables.scss
export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.md;
} 