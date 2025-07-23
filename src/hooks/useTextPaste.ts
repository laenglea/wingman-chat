import { useCallback } from 'react';

export function useTextPaste() {
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Use document.execCommand to insert text, which is undoable
    document.execCommand('insertText', false, text);
  }, []);

  return handlePaste;
}
