import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import pLimit from 'p-limit';
import { Client } from '../lib/client';
import { VectorDB, Document } from '../lib/vectordb';

export interface FileItem {
  id: string;
  file: File;

  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  
  text?: string;
  segments?: Array<{
    text: string;
    vector: number[];
  }>;
  error?: string;
}

interface DocumentContextType {
  files: FileItem[];
  vectorDB: VectorDB;
  addFiles: (selectedFiles: FileList) => void;
  removeFile: (fileId: string) => void;
  processFile: (fileId: string) => Promise<void>;
  processAllFiles: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [vectorDB] = useState(() => new VectorDB());
  const [client] = useState(() => new Client());

  const addFiles = useCallback((selectedFiles: FileList) => {
    const newFiles: FileItem[] = Array.from(selectedFiles).map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const processFile = useCallback(async (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
    ));

    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Step 1: Extract text (0% -> 10%)
      const text = await client.extractText(file.file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, text, progress: 10 } : f
      ));

      // Step 2: Segment text (10% -> 20%)
      const segments = await client.segmentText(file.file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 20 } : f
      ));

      // Step 3: Embed segments (20% -> 100%)
      // Process segments with up to 10 parallel threads using p-limit
      const limit = pLimit(10);
      let completedCount = 0;
      
      const embeddingPromises = segments.map((segment) =>
        limit(async () => {
          const vector = await client.embedText(segment);
          completedCount++;
          
          // Update progress after each embedding completes
          const progressPercentage = segments.length > 0 ? (completedCount / segments.length) * 80 : 0;
          const currentProgress = 20 + progressPercentage;
          
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: Math.min(Math.round(currentProgress), 100) } : f
          ));
          
          return { text: segment, vector };
        })
      );
      
      const chunks = await Promise.all(embeddingPromises);

      // Store each chunk as a separate document in vector database
      chunks.forEach((chunk, index) => {
        const chunkDoc: Document = {
          id: `${fileId}:${index}`,
          text: chunk.text,
          source: file.file.name,
          vector: chunk.vector
        };

        vectorDB.addDocument(chunkDoc);
      });

      // Mark as completed only after everything including vector DB storage is done
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          segments: chunks,
          status: 'completed', 
          progress: 100 
        } : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ));
    }
  }, [files, vectorDB, client]);

  const processAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    for (const file of pendingFiles) {
      await processFile(file.id);
    }
  }, [files, processFile]);

  return (
    <DocumentContext.Provider
      value={{
        files,
        vectorDB,
        addFiles,
        removeFile,
        processFile,
        processAllFiles,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}
