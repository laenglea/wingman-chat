import { useState, useCallback, useEffect, useRef } from 'react';
import pLimit from 'p-limit';
import { Client } from '../lib/client';
import { VectorDB, Document } from '../lib/vectordb';
import { Tool } from '../models/chat';
import { RepositoryFile } from '../types/repository';
import { setValue, getValue, deleteValue } from '../lib/db';

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

// Shared client instance for all repositories
const sharedClient = new Client();

// Helper function to get database key for repository files
const getRepositoryFilesKey = (repositoryId: string) => `repository_files_${repositoryId}`;

// Helper function to cleanup repository data when a repository is deleted
export const cleanupRepositoryData = async (repositoryId: string) => {
  try {
    await deleteValue(getRepositoryFilesKey(repositoryId));
  } catch (error) {
    console.error(`Failed to cleanup data for repository ${repositoryId}:`, error);
  }
};

export function useRepositoryDocuments(repositoryId: string): RepositoryDocumentHookReturn {
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [vectorDB, setVectorDB] = useState(() => new VectorDB());
  const currentRepositoryIdRef = useRef(repositoryId);
  
  // Update ref whenever repositoryId changes
  useEffect(() => {
    currentRepositoryIdRef.current = repositoryId;
  }, [repositoryId]);

  // Handle repository changes and loading in a single effect
  useEffect(() => {
    let isCancelled = false;
    
    const loadRepositoryData = async () => {
      // Immediately clear current state
      setFiles([]);
      setVectorDB(new VectorDB());
      
      try {
        const savedFiles = await getValue<RepositoryFile[]>(getRepositoryFilesKey(repositoryId));
        
        // Check if this effect is still relevant
        if (isCancelled) return;
        
        if (savedFiles && savedFiles.length > 0) {
          const parsedFiles = savedFiles.map(file => ({
            ...file,
            uploadedAt: new Date(file.uploadedAt),
          }));
          
          // Rebuild vector database for this repository
          const newVectorDB = new VectorDB();
          savedFiles.forEach(file => {
            if (file.segments) {
              file.segments.forEach((segment: { text: string; vector: number[] }, index: number) => {
                const chunkDoc: Document = {
                  id: `${repositoryId}:${file.id}:${index}`,
                  text: segment.text,
                  source: file.name,
                  vector: segment.vector
                };
                newVectorDB.addDocument(chunkDoc);
              });
            }
          });
          
          // Only update state if this effect hasn't been cancelled
          if (!isCancelled) {
            setFiles(parsedFiles);
            setVectorDB(newVectorDB);
          }
        }
      } catch (error) {
        console.error(`Failed to load files for repository ${repositoryId}:`, error);
      }
    };

    loadRepositoryData();

    // Cleanup function to cancel this effect if repositoryId changes
    return () => {
      isCancelled = true;
    };
  }, [repositoryId]);

  // Save files to database when they change (but not during repository switching)
  useEffect(() => {
    const saveFiles = async () => {
      try {
        const serializableFiles = files.map(file => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { file: _, ...rest } = file;
          return rest;
        });
        await setValue(getRepositoryFilesKey(repositoryId), serializableFiles);
      } catch (error) {
        console.error(`Failed to save files for repository ${repositoryId}:`, error);
      }
    };
    
    // Always save files array (including when empty after deletion)
    // Skip only during the initial load when repositoryId changes
    const timeoutId = setTimeout(() => {
      saveFiles();
    }, 100); // Small delay to avoid saving during rapid state changes
    
    return () => clearTimeout(timeoutId);
  }, [files, repositoryId]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      
      // Remove documents from vector database for this file
      // Documents have IDs in format: repositoryId:fileId:segmentIndex
      const currentRepoId = currentRepositoryIdRef.current;
      
      // Find the file being removed to get its segments count
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.segments) {
        // Remove all segments for this file from vector database
        for (let i = 0; i < fileToRemove.segments.length; i++) {
          const documentId = `${currentRepoId}:${fileId}:${i}`;
          vectorDB.deleteDocument(documentId);
        }
      }
      
      return updatedFiles;
    });
  }, [vectorDB]);

  const processFile = useCallback(async (file: File, fileId: string) => {
    const currentRepoId = currentRepositoryIdRef.current;
    
    // Extract text
    const text = await sharedClient.extractText(file);
    // Check if repository changed during processing
    if (currentRepositoryIdRef.current !== currentRepoId) return;
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, text, progress: 10 } : f
    ));

    // Segment text
    const segments = await sharedClient.segmentText(file);
    // Check if repository changed during processing
    if (currentRepositoryIdRef.current !== currentRepoId) return;
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, progress: 20 } : f
    ));

    // Embed segments with progress tracking
    const limit = pLimit(10);
    let completedCount = 0;
    
    const chunks = await Promise.all(
      segments.map(segment =>
        limit(async () => {
          const vector = await sharedClient.embedText(segment);
          completedCount++;
          
          // Check if repository changed during processing
          if (currentRepositoryIdRef.current !== currentRepoId) return { text: segment, vector };
          
          const progress = 20 + (completedCount / segments.length) * 80;
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: Math.round(progress) } : f
          ));
          
          return { text: segment, vector };
        })
      )
    );

    // Final check before storing results
    if (currentRepositoryIdRef.current !== currentRepoId) return;

    // Store in vector database
    chunks.forEach((chunk, index) => {
      const chunkDoc: Document = {
        id: `${currentRepoId}:${fileId}:${index}`,
        text: chunk.text,
        source: file.name,
        vector: chunk.vector
      };
      vectorDB.addDocument(chunkDoc);
    });

    // Mark as completed
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        segments: chunks,
        status: 'completed', 
        progress: 100 
      } : f
    ));
  }, [vectorDB]);

  const addFile = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID();
    const currentRepoId = currentRepositoryIdRef.current;
    
    // Add file to state as processing
    setFiles(prev => [...prev, {
      id: fileId,
      repositoryId: currentRepoId,
      name: file.name,
      file,
      status: 'processing',
      progress: 0,
      uploadedAt: new Date(),
    }]);

    try {
      await processFile(file, fileId);
    } catch (error) {
      // Only update error state if we're still on the same repository
      if (currentRepositoryIdRef.current === currentRepoId) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ));
      }
    }
  }, [processFile]);

  const queryChunks = useCallback(async (query: string, topK: number = 5): Promise<FileChunk[]> => {
    if (!query.trim()) return [];

    try {
      const queryVector = await sharedClient.embedText(query);
      const results = vectorDB.queryDocuments(queryVector, topK);
      
      // Filter and convert results
      return results
        .filter(result => result.document.id.startsWith(`${repositoryId}:`))
        .map(result => {
          const parts = result.document.id.split(':');
          const fileId = parts[1];
          const fileItem = files.find(f => f.id === fileId);
          
          return {
            fileItem: fileItem!,
            text: result.document.text,
            similarity: result.similarity
          };
        })
        .filter(chunk => chunk.fileItem);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [vectorDB, repositoryId, files]);

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
          console.log(`🔍 find_documents tool invoked with query: "${query}"`);
          
          if (!query) {
            console.log('❌ No query provided');
            return JSON.stringify({ error: 'No query provided' });
          }

          try {
            const results = await queryChunks(query, 5);
            console.log(`📊 Query results: ${results.length} chunks found`);
            
            if (results.length === 0) {
              console.log('📭 No relevant documents found');
              return JSON.stringify([]);
            }

            const jsonResults = results.map((result, index) => {
              console.log(`📄 Result ${index + 1}:`);
              console.log(`   File: ${result.fileItem.name}`);
              console.log(`   Similarity: ${(result.similarity || 0).toFixed(3)}`);
              console.log(`   Text preview: ${result.text.substring(0, 100)}...`);
              
              return {
                file_name: result.fileItem.name,
                file_chunk: result.text,
                similarity: result.similarity || 0
              };
            });

            console.log(`✅ Returning ${jsonResults.length} document chunks`);
            return JSON.stringify(jsonResults);
          } catch (error) {
            console.error('❌ Repository knowledge query failed:', error);
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
