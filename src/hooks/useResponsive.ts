import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'app_responsive';

export function useResponsive() {
  const [isResponsive, setIsResponsive] = useState<boolean>(() => {
    // Initialize from localStorage or default to true
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleResponsive = useCallback(() => {
    setIsResponsive(prev => {
      const newValue = !prev;
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      } catch {
        // Silently fail if localStorage is not available
      }
      return newValue;
    });
  }, []);

  // Sync with localStorage when the hook mounts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isResponsive));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isResponsive]);

  return {
    isResponsive,
    toggleResponsive,
  };
}
