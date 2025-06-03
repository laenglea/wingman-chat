import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type SidebarContextType = {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  toggleSidebar: () => void;
  sidebarContent: ReactNode;
  setSidebarContent: (content: ReactNode) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<ReactNode>(null);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        showSidebar,
        setShowSidebar,
        toggleSidebar,
        sidebarContent,
        setSidebarContent,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
