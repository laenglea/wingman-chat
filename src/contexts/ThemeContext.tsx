import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';

// Support light, dark, or system preference modes
export type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem('app_theme');
    return stored === 'light' || stored === 'dark' ? (stored as Theme) : 'system';
  });

  // Track real system preference
  const [systemPref, setSystemPref] = useState<boolean>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Listen for system preference changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Determine effective dark state
  const isDark = theme === 'dark' || (theme === 'system' && systemPref);

  // Apply the class and persist explicit choices
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    if (theme === 'system') {
      localStorage.removeItem('app_theme');
    } else {
      localStorage.setItem('app_theme', theme);
    }
  }, [isDark, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
