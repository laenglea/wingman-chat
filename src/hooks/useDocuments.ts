import { useState, useCallback } from 'react';
import pLimit from 'p-limit';
import { Client } from '../lib/client';
import { VectorDB, Document } from '../lib/vectordb';
import { Tool } from '../models/chat';

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

export interface FileChunk {
  fileItem: FileItem;
  text: string;
  similarity?: number;
}

export interface DocumentHookReturn {
  files: FileItem[];
  addFile: (file: File) => Promise<void>;
  removeFile: (fileId: string) => void;
  queryChunks: (query: string, topK?: number) => Promise<FileChunk[]>;
  queryTools: () => Tool[];
}

export function useDocuments(): DocumentHookReturn {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [vectorDB] = useState(() => new VectorDB());
  const [client] = useState(() => new Client());

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const addFile = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID();
    
    // Add file to state as processing
    setFiles(prev => [...prev, {
      id: fileId,
      file,
      status: 'processing',
      progress: 0,
    }]);

    try {
      // Step 1: Extract text (0% -> 10%)
      const text = await client.extractText(file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, text, progress: 10 } : f
      ));

      // Step 2: Segment text (10% -> 20%)
      const segments = await client.segmentText(file);
      
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
          source: file.name,
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
  }, [vectorDB, client]);

  const queryChunks = useCallback(async (query: string, topK: number = 5): Promise<FileChunk[]> => {
    if (!query.trim()) {
      return [];
    }

    try {
      // Generate embedding for search query
      const queryVector = await client.embedText(query);
      
      // Search the vector database
      const results = vectorDB.queryDocuments(queryVector, topK);
      
      // Convert QueryResult[] to FileChunk[]
      const fileChunks: FileChunk[] = results.map(result => {
        // Extract fileId from document id (format: fileId:segmentIndex)
        const fileId = result.document.id.split(':')[0];
        const fileItem = files.find(f => f.id === fileId);
        
        return {
          fileItem: fileItem!, // We know it exists since it's in the vector DB
          text: result.document.text,
          similarity: result.similarity
        };
      }).filter(chunk => chunk.fileItem); // Filter out any chunks where fileItem wasn't found
      
      return fileChunks;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [vectorDB, client, files]);

  const queryTools = useCallback((): Tool[] => {
    return [
      {
        name: 'query_knowledge',
        description: 'Find relevant information in knowledge database',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to find relevant information'
            }
          },
          required: ['query']
        },
        function: async (args: Record<string, unknown>): Promise<string> => {
          const query = args.query as string;
          if (!query) {
            return JSON.stringify({ error: 'No query provided' });
          }

          try {
            const results = await queryChunks(query, 5);
            if (results.length === 0) {
              return JSON.stringify([]);
            }

            // Format results as JSON array
            const jsonResults = results.map(result => ({
              file_name: result.fileItem.file.name,
              file_chunk: result.text,
              similarity: result.similarity || 0
            }));

            return JSON.stringify(jsonResults);
          } catch (error) {
            console.error('Knowledge query failed:', error);
            return JSON.stringify({ error: 'Failed to query knowledge database' });
          }
        }
      }
    ];
  }, [queryChunks]);

  return {
    files,
    removeFile,
    addFile,
    queryChunks,
    queryTools,
  };
}
