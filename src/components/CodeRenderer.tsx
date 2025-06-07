import { memo } from 'react';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from '../contexts/ThemeContext';
import { CopyButton } from './CopyButton';

interface CodeRendererProps {
  code: string;
  language: string;
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
  'cs': 'csharp',
  'c++': 'cpp',
  'dockerfile': 'docker',
};

const NonMemoizedCodeRenderer = ({ code, language }: CodeRendererProps) => {
  const { isDark } = useTheme();
  
  // Normalize the language
  const normalizedLanguage = languageMap[language.toLowerCase()] || language.toLowerCase();
  
  return (
    <div className="relative my-4">
      <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
        <span>{language}</span>
        <CopyButton text={code} />
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-b-md border border-gray-200 dark:border-neutral-700 overflow-x-auto">
        <SyntaxHighlighter
          className="!mt-0 !mb-0"
          children={code}
          PreTag="div"
          style={isDark ? oneDark : oneLight}
          language={normalizedLanguage}
          wrapLines
          customStyle={{
            margin: 0,
            borderRadius: 0,
            backgroundColor: 'transparent', // Let the parent container handle the background
            padding: '1rem',
          }}
        />
      </div>
    </div>
  );
};

export const CodeRenderer = memo(
  NonMemoizedCodeRenderer,
  (prevProps, nextProps) => 
    prevProps.code === nextProps.code && prevProps.language === nextProps.language
);
