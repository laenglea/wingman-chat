import { useState, useEffect } from 'react';
import { Code, FileText } from 'lucide-react';
import { Button } from '@headlessui/react';
import { TextEditor } from './TextEditor';

// Component to display HTML content in iframe
function HtmlPreview({ blob, filename }: { blob: Blob; filename: string }) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHtml = async () => {
      try {
        const text = await blob.text();
        setHtmlContent(text);
      } catch {
        setHtmlContent('<p>Error loading HTML content</p>');
      } finally {
        setLoading(false);
      }
    };

    loadHtml();
  }, [blob]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 dark:border-neutral-700 h-full flex items-center justify-center">
        <div className="text-neutral-500">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 dark:border-neutral-700 h-full">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full rounded-lg"
        title={`Preview of ${filename}`}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

interface HtmlEditorProps {
  blob: Blob;
  filename: string;
}

export function HtmlEditor({ blob, filename }: HtmlEditorProps) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* View Mode Toggle */}
      <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-700 p-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'code'
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Code size={16} />
            Code
          </Button>
          <Button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'preview'
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <FileText size={16} />
            Preview
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {viewMode === 'preview' ? (
            <HtmlPreview blob={blob} filename={filename} />
          ) : (
            <TextEditor blob={blob} filename={filename} />
          )}
        </div>
      </div>
    </div>
  );
}
