import { useLayout } from './useLayout';
import { useTheme } from '../contexts/ThemeContext';

export const useSettings = () => {
  // Use existing context hooks
  const layoutContext = useLayout();
  const themeContext = useTheme();
  
  return {
    // Layout settings
    layoutMode: layoutContext.layoutMode,
    setLayoutMode: layoutContext.setLayoutMode,
    // Theme settings (re-export for convenience)
    theme: themeContext.theme,
    setTheme: themeContext.setTheme,
    isDark: themeContext.isDark,
  };
};
