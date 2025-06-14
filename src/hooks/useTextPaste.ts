import { useCallback } from 'react';

export function useTextPaste(
  contentEditableRef: React.RefObject<HTMLDivElement | null>,
  setContent: (content: string) => void
) {
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const plainText = e.clipboardData.getData('text/plain');
    
    if (plainText && contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(plainText));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        contentEditableRef.current.textContent += plainText;
      }
      
      setContent(contentEditableRef.current.textContent || "");
    }
  }, [contentEditableRef, setContent]);

  return handlePaste;
}
