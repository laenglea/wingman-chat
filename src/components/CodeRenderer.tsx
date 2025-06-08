import { memo, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CopyButton } from './CopyButton';

interface CodeRendererProps {
  code: string;
  language: string;
}

interface SyntaxHighlighterType {
  default: React.ComponentType<any>;
}

interface StylesType {
  oneDark: any;
  oneLight: any;
}

// Only map essential language aliases that need normalization
const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'sh': 'shell',
  'bash': 'shell',
  'yml': 'yaml',
  'rb': 'ruby',
  'rs': 'rust',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'json': 'json',
  'md': 'markdown',
  'html': 'markup',
  'xml': 'markup',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'go': 'go',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'php': 'php',
  'sql': 'sql',
  'r': 'r',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'dart': 'dart'
};

const NonMemoizedCodeRenderer = ({ code, language }: CodeRendererProps) => {
  const { isDark } = useTheme();
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<React.ComponentType<any> | null>(null);
  const [styles, setStyles] = useState<StylesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically import syntax highlighter
  useEffect(() => {
    const loadSyntaxHighlighter = async () => {
      try {
        const [highlighterModule, stylesModule] = await Promise.all([
          import("react-syntax-highlighter").then(module => ({ 
            default: module.Prism 
          })) as Promise<SyntaxHighlighterType>,
          import("react-syntax-highlighter/dist/esm/styles/prism").then(module => ({
            oneDark: module.oneDark,
            oneLight: module.oneLight
          })) as Promise<StylesType>
        ]);

        setSyntaxHighlighter(() => highlighterModule.default);
        setStyles(stylesModule);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load syntax highlighter:', error);
        setIsLoading(false);
      }
    };

    loadSyntaxHighlighter();
  }, []);

  const normalizedLanguage = languageMap[language.toLowerCase()] || language.toLowerCase();

  // Show loading state while syntax highlighter is loading
  if (isLoading) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
            <CopyButton text={code} />
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <pre className="text-gray-800 dark:text-neutral-300 text-sm whitespace-pre-wrap overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  }

  // Fallback to plain text if syntax highlighter failed to load
  if (!SyntaxHighlighter || !styles) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
          <CopyButton text={code} />
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <pre className="text-gray-800 dark:text-neutral-300 text-sm whitespace-pre-wrap overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-4">
      <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
        <span>{language}</span>
        <CopyButton text={code} />
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-b-md border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={isDark ? styles.oneDark : styles.oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.25rem'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace'
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const CodeRenderer = memo(
  NonMemoizedCodeRenderer,
  (prevProps, nextProps) => 
    prevProps.code === nextProps.code && 
    prevProps.language === nextProps.language
);
