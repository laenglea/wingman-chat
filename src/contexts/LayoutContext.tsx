import { createContext, useState, useLayoutEffect, ReactNode } from 'react';

export type LayoutMode = 'normal' | 'wide';

type LayoutContextType = {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  // Initialize layout mode from localStorage
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window === 'undefined') return 'normal';
    
    const stored = localStorage.getItem('app_layout');
    return stored === 'wide' ? 'wide' : 'normal';
  });

  // Persist layout mode changes
  const handleSetLayoutMode = (mode: LayoutMode) => {
    setLayoutMode(mode);
    
    if (mode === 'normal') {
      localStorage.removeItem('app_layout');
    } else {
      localStorage.setItem('app_layout', mode);
    }
  };

  // Apply any layout-specific effects
  useLayoutEffect(() => {
    // Apply wide class when in wide mode (responsive/takes more space)
    document.documentElement.classList.toggle('layout-wide', layoutMode === 'wide');
  }, [layoutMode]);

  return (
    <LayoutContext.Provider 
      value={{ 
        layoutMode, 
        setLayoutMode: handleSetLayoutMode
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export { LayoutContext };
