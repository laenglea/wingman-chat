import { useState, useEffect } from 'react';

interface TextEditorProps {
  blob: Blob;
  filename: string;
}

export function TextEditor({ blob }: TextEditorProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readBlob = async () => {
      try {
        const text = await blob.text();
        setContent(text);
      } catch {
        setContent('Error reading file content');
      } finally {
        setLoading(false);
      }
    };

    readBlob();
  }, [blob]);

  if (loading) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-900 h-full flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 h-full">
      <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono h-full overflow-auto p-4">
        {content}
      </pre>
    </div>
  );
}
