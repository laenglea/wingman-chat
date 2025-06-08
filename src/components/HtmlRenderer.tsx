import { memo, useState, useEffect } from 'react';
import { Eye, Code } from 'lucide-react';
import { Button } from '@headlessui/react';
import { CopyButton } from './CopyButton';

interface HtmlRendererProps {
  html: string;
  language: string;
}

const NonMemoizedHtmlRenderer = ({ html, language }: HtmlRendererProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Basic HTML validation and sanitization check
  const isValidHtml = (htmlString: string): boolean => {
    const trimmed = htmlString.trim();
    return trimmed.length > 0 && (
      trimmed.includes('<') && trimmed.includes('>')
    );
  };

  const hasValidHtml = isValidHtml(html);

  // Handle loading state based on HTML content - this must always run
  useEffect(() => {
    if (!html.trim()) {
      setIsLoading(true);
      return;
    }

    // Debounce loading to avoid flickering during streaming
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [html]);

  // Show loading placeholder while streaming or processing
  if (isLoading && !html.trim()) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-center h-24 text-gray-500 dark:text-neutral-500">
            <div className="animate-pulse">Waiting for HTML...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while processing
  if (isLoading && html.trim()) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-center h-24 text-gray-500 dark:text-neutral-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Rendering HTML...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-4">
      <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
        <span>{language}</span>
        <div className="flex items-center gap-2">
          {hasValidHtml && (
            <Button
              onClick={() => setShowPreview(!showPreview)}
              className="text-neutral-300 hover:text-white transition-colors"
              title={showPreview ? 'Show code' : 'Show preview'}
            >
              {showPreview ? (
                <Code className="h-4" />
              ) : (
                <Eye className="h-4" />
              )}
            </Button>
          )}
          <CopyButton text={html} />
        </div>
      </div>
      
      <div className="bg-white dark:bg-neutral-800 rounded-b-md">
        {hasValidHtml && showPreview ? (
          <iframe
            srcDoc={html}
            className="w-full aspect-[16/9] rounded-b-md"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
          />
        ) : (
          <div className="p-4">
            <pre className="text-gray-800 dark:text-neutral-300 text-sm whitespace-pre-wrap overflow-x-auto">
              <code>{html}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export const HtmlRenderer = memo(
  NonMemoizedHtmlRenderer,
  (prevProps, nextProps) => 
    prevProps.html === nextProps.html && prevProps.language === nextProps.language
);
