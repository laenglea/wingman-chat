import { useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { ArtifactsContext } from './ArtifactsContext';
import { FileSystem } from '../types/file';
import { FileSystemManager } from '../lib/fs';
import { getConfig } from '../config';

interface ArtifactsProviderProps {
  children: ReactNode;
}

export function ArtifactsProvider({ children }: ArtifactsProviderProps) {
  const [filesystem, setFilesystem] = useState<FileSystem>({});
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showArtifactsDrawer, setShowArtifactsDrawer] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check artifacts availability from config
  useEffect(() => {
    try {
      const config = getConfig();
      setIsAvailable(config.artifacts.enabled);
    } catch (error) {
      console.warn('Failed to get artifacts config:', error);
      setIsAvailable(false);
    }
  }, []);

  // Add setFs function to swap entire filesystem
  const setFs = useCallback((newFilesystem: FileSystem) => {
    setFilesystem(newFilesystem);
    // Reset files when filesystem changes
    setOpenFiles([]);
    setActiveFile(null);
  }, []);

  const openFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
    setActiveFile(path);
  }, []);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(file => file !== path);
      
      // If closing the active file, set a new active file
      if (path === activeFile) {
        const index = prev.indexOf(path);
        const newActiveFile = newFiles.length > 0 
          ? newFiles[Math.min(index, newFiles.length - 1)]
          : null;
        setActiveFile(newActiveFile);
      }
      
      return newFiles;
    });
  }, [activeFile]);

  // Create FileSystemManager instance
  const fs = useMemo(() => new FileSystemManager(
    filesystem,
    setFilesystem,
    openFile,  // Auto-open newly created files
    closeFile, // Auto-close files when files are deleted
    (oldPath: string, newPath: string) => {
      // Handle file rename: update open tabs
      setOpenFiles(prev => prev.map(path => path === oldPath ? newPath : path));
      // Update active file if it was renamed
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
    }
  ), [filesystem, openFile, closeFile, activeFile]);

  const toggleArtifactsDrawer = useCallback(() => {
    setShowArtifactsDrawer(prev => !prev);
  }, []);

  const value = {
    isAvailable,
    fs,
    setFs,
    openFiles,
    activeFile,
    showArtifactsDrawer,
    openFile,
    closeFile,
    setShowArtifactsDrawer,
    toggleArtifactsDrawer,
  };

  return (
    <ArtifactsContext.Provider value={value}>
      {children}
    </ArtifactsContext.Provider>
  );
}
