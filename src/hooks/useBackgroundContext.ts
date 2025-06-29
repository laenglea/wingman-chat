import { useContext } from 'react';
import { BackgroundContext, BackgroundContextValue } from '../contexts/BackgroundContext';

/**
 * Hook to access background settings and current wallpaper.
 * Must be used within a BackgroundProvider.
 */
export function useBackgroundContext(): BackgroundContextValue {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackgroundContext must be used within BackgroundProvider');
  }
  return context;
}
