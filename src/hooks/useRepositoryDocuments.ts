import { useState, useCallback, useEffect } from 'react';
import pLimit from 'p-limit';
import { Client } from '../lib/client';
import { VectorDB, Document } from '../lib/vectordb';
import { Tool } from '../models/chat';
import { RepositoryFile } from '../types/repository';

export interface FileChunk {
  fileItem: RepositoryFile;
  text: string;
  similarity?: number;
}

export interface RepositoryDocumentHookReturn {
  files: RepositoryFile[];
  addFile: (file: File) => Promise<void>;
  removeFile: (fileId: string) => void;
  queryChunks: (query: string, topK?: number) => Promise<FileChunk[]>;
  queryTools: () => Tool[];
}

// Global storage for files by repository ID
const repositoryFilesMap = new Map<string, RepositoryFile[]>();

// Global storage for vector databases by repository ID
const repositoryVectorDBMap = new Map<string, VectorDB>();

// Global storage for clients by repository ID
const repositoryClientMap = new Map<string, Client>();

export function useRepositoryDocuments(repositoryId: string): RepositoryDocumentHookReturn {
  // Initialize files for this repository if not exists
  const [files, setFiles] = useState<RepositoryFile[]>(() => {
    return repositoryFilesMap.get(repositoryId) || [];
  });
  
  // Get or create shared vectorDB and client for this repository
  const vectorDB = (() => {
    if (!repositoryVectorDBMap.has(repositoryId)) {
      repositoryVectorDBMap.set(repositoryId, new VectorDB());
    }
    return repositoryVectorDBMap.get(repositoryId)!;
  })();

  const client = (() => {
    if (!repositoryClientMap.has(repositoryId)) {
      repositoryClientMap.set(repositoryId, new Client());
    }
    return repositoryClientMap.get(repositoryId)!;
  })();

  // Update global map when files change
  useEffect(() => {
    repositoryFilesMap.set(repositoryId, files);
  }, [repositoryId, files]);

  // Load files for this repository when repositoryId changes
  useEffect(() => {
    const repositoryFiles = repositoryFilesMap.get(repositoryId) || [];
    setFiles(repositoryFiles);
  }, [repositoryId]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // TODO: Also remove from vector database
  }, []);

  const addFile = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID();
    
    // Add file to state as processing
    setFiles(prev => [...prev, {
      id: fileId,
      repositoryId,
      name: file.name,
      file,
      status: 'processing',
      progress: 0,
      uploadedAt: new Date(),
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

      // Store each chunk as a separate document in vector database with repository namespace
      chunks.forEach((chunk, index) => {
        const chunkDoc: Document = {
          id: `${repositoryId}:${fileId}:${index}`,
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
  }, [vectorDB, client, repositoryId]);

  const queryChunks = useCallback(async (query: string, topK: number = 5): Promise<FileChunk[]> => {
    if (!query.trim()) {
      return [];
    }

    try {
      // Generate embedding for search query
      const queryVector = await client.embedText(query);
      
      // Search the vector database
      const results = vectorDB.queryDocuments(queryVector, topK);
      
      // Filter results to only include documents from this repository
      const repositoryResults = results.filter(result => 
        result.document.id.startsWith(`${repositoryId}:`)
      );
      
      // Convert QueryResult[] to FileChunk[]
      const fileChunks: FileChunk[] = repositoryResults.map(result => {
        // Extract fileId from document id (format: repositoryId:fileId:segmentIndex)
        const parts = result.document.id.split(':');
        const fileId = parts[1];
        
        // Get files from global map to ensure we have the latest state
        const currentFiles = repositoryFilesMap.get(repositoryId) || [];
        const fileItem = currentFiles.find(f => f.id === fileId);
        
        return {
          fileItem: fileItem!,
          text: result.document.text,
          similarity: result.similarity
        };
      }).filter(chunk => chunk.fileItem); // Filter out any chunks where fileItem wasn't found
      
      return fileChunks;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [vectorDB, client, repositoryId]);

  const queryTools = useCallback((): Tool[] => {
    return [
      {
        name: 'find_documents',
        description: 'find possible relevant information to user queries.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: `The search query to find relevant information.
              Transform the query into a better search query for retrieving relevant documents.
              
              Rules:
              - Make queries more specific and descriptive
              - Include technical terms and synonyms
              - Expand abbreviations
              - Add context when helpful
              - Keep under 100 words`
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
              file_name: result.fileItem.name,
              file_chunk: result.text,
              similarity: result.similarity || 0
            }));

            return JSON.stringify(jsonResults);
          } catch (error) {
            console.error('Repository knowledge query failed:', error);
            return JSON.stringify({ error: 'Failed to query repository knowledge database' });
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
