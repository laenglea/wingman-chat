import { useState, useCallback, useEffect } from 'react';

const RESPONSIVE_MODE_KEY = 'app_responsiveness';

export function useResponsiveness() {
  const [isResponsive, setIsResponsive] = useState<boolean>(() => {
    // Initialize from localStorage or default to true
    try {
      const stored = localStorage.getItem(RESPONSIVE_MODE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleResponsiveness = useCallback(() => {
    setIsResponsive(prev => {
      const newValue = !prev;
      // Persist to localStorage
      try {
        localStorage.setItem(RESPONSIVE_MODE_KEY, JSON.stringify(newValue));
      } catch {
        // Silently fail if localStorage is not available
      }
      return newValue;
    });
  }, []);

  // Sync with localStorage when the hook mounts
  useEffect(() => {
    try {
      localStorage.setItem(RESPONSIVE_MODE_KEY, JSON.stringify(isResponsive));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isResponsive]);

  return {
    isResponsive,
    toggleResponsiveness,
  };
}
