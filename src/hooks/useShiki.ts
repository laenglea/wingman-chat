import { useState, useEffect } from 'react';
import { useTheme } from './useTheme';

export function useShiki() {
  const [highlighter, setHighlighter] = useState<Record<string, unknown> | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const { createHighlighter } = await import('shiki');
        const shiki = await createHighlighter({
          themes: ['one-dark-pro', 'one-light'],
          langs: [] // Start with no languages, load them dynamically
        });
        setHighlighter(shiki as unknown as Record<string, unknown>);
      } catch (error) {
        console.error('Failed to initialize Shiki:', error);
      }
    };
    
    initHighlighter();
  }, []);

  const codeToHtml = async (code: string, language: string) => {
    // Wait for highlighter to be initialized
    while (!highlighter) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    try {
      // Try to load the language if it's available
      try {
        const { bundledLanguages } = await import('shiki');
        if (bundledLanguages[language as keyof typeof bundledLanguages]) {
          await (highlighter as unknown as { loadLanguage: (lang: string) => Promise<void> }).loadLanguage(language as keyof typeof bundledLanguages);
        }
      } catch {
        // Language loading failed, but Shiki might still recognize it as an alias
      }

      const theme = isDark ? 'one-dark-pro' : 'one-light';

      return (highlighter as unknown as { codeToHtml: (code: string, options: Record<string, unknown>) => string }).codeToHtml(code, {
        lang: language,
        theme,
        colorReplacements: {
          '#fafafa': 'transparent', // one-light background
          '#282c34': 'transparent', // one-dark-pro background
        }
      });
    } catch (error) {
      console.error('Code highlighting failed:', error);
      return `<pre><code>${code}</code></pre>`;
    }
  };

  return {
    codeToHtml
  };
}
