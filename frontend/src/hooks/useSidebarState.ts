import { useState, useEffect } from 'react';
import { isMobile } from '../utils/breakpoints';

const SIDEBAR_STORAGE_KEY = 'filter-sidebar-expanded';

function getInitialSidebarState(): boolean {
  // Default to closed on mobile, check localStorage on desktop
  const mobile = isMobile();
  
  if (mobile) {
    return false; // Always start closed on mobile
  }
  
  // On desktop, check localStorage for user preference
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  }
  
  // Default to closed if no preference stored
  return false;
}

export function useSidebarState() {
  const [showSidebar, setShowSidebar] = useState<boolean>(() => getInitialSidebarState());

  // Save to localStorage when state changes (but only on desktop)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = isMobile();
      
      // Only persist on desktop - mobile should always start closed
      if (!mobile) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, showSidebar.toString());
      }
    }
  }, [showSidebar]);

  // Handle window resize to reset mobile behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobile();
      
      // Auto-close on mobile when resizing to mobile viewport
      if (mobile && showSidebar) {
        setShowSidebar(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showSidebar]);

  return [showSidebar, setShowSidebar] as const;
} 