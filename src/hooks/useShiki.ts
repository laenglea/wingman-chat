import { useEffect } from 'react';
import { useTheme } from './useTheme';
import type { Highlighter } from 'shiki';

// Singleton highlighter instance
let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

const getShikiHighlighter = async (): Promise<Highlighter> => {
  if (highlighter) {
    return highlighter;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = (async () => {
    try {
      const { createHighlighter } = await import('shiki');
      highlighter = await createHighlighter({
        themes: ['one-dark-pro', 'one-light'],
        langs: [] // Start with no languages, load them dynamically
      });
      return highlighter;
    } catch (error) {
      console.error('Failed to initialize Shiki:', error);
      highlighterPromise = null; // Reset promise on error so we can retry
      throw error;
    }
  })();

  return highlighterPromise;
};

export function useShiki() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Pre-initialize the highlighter on first use
    getShikiHighlighter().catch(console.error);
  }, []);

  const codeToHtml = async (code: string, language: string) => {
    try {
      // Get the singleton highlighter instance
      const shiki = await getShikiHighlighter();
      
      // Try to load the language if it's available
      try {
        const { bundledLanguages } = await import('shiki');
        if (bundledLanguages[language as keyof typeof bundledLanguages]) {
          await shiki.loadLanguage(language as keyof typeof bundledLanguages);
        }
      } catch {
        // Language loading failed, but Shiki might still recognize it as an alias
      }

      const theme = isDark ? 'one-dark-pro' : 'one-light';

      return shiki.codeToHtml(code, {
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
