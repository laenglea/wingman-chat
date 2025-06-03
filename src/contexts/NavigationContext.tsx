import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * NavigationContext provides a way for pages to set custom actions 
 * in the left and right areas of the navigation bar.
 * 
 * Usage example:
 * ```tsx
 * const { setLeftActions, setRightActions } = useNavigation();
 * 
 * useEffect(() => {
 *   setLeftActions(<MyLeftButton />);
 *   setRightActions(<MyRightButton />);
 *   
 *   return () => {
 *     setLeftActions(null);
 *     setRightActions(null);
 *   };
 * }, []);
 * ```
 */

type NavigationContextType = {
  leftActions: ReactNode;
  setLeftActions: (actions: ReactNode) => void;
  rightActions: ReactNode;
  setRightActions: (actions: ReactNode) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [leftActions, setLeftActions] = useState<ReactNode>(null);
  const [rightActions, setRightActions] = useState<ReactNode>(null);

  return (
    <NavigationContext.Provider
      value={{
        leftActions,
        setLeftActions,
        rightActions,
        setRightActions,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
