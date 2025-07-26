import { TextEditor } from './TextEditor';

interface CodeEditorProps {
  blob: Blob;
  filename: string;
}

export function CodeEditor({ blob, filename }: CodeEditorProps) {
  return <TextEditor blob={blob} filename={filename} />;
}
