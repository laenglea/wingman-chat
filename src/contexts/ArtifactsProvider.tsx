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
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
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
    // Reset tabs when filesystem changes
    setOpenTabs([]);
    setActiveTab(null);
  }, []);

  const openTab = useCallback((path: string) => {
    setOpenTabs(prev => {
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
    setActiveTab(path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab !== path);
      
      // If closing the active tab, set a new active tab
      if (path === activeTab) {
        const index = prev.indexOf(path);
        const newActiveTab = newTabs.length > 0 
          ? newTabs[Math.min(index, newTabs.length - 1)]
          : null;
        setActiveTab(newActiveTab);
      }
      
      return newTabs;
    });
  }, [activeTab]);

  // Create FileSystemManager instance
  const fs = useMemo(() => new FileSystemManager(
    filesystem,
    setFilesystem,
    openTab,  // Auto-open newly created files
    closeTab  // Auto-close tabs when files are deleted
  ), [filesystem, openTab, closeTab]);

  const toggleArtifactsDrawer = useCallback(() => {
    setShowArtifactsDrawer(prev => !prev);
  }, []);

  const value = {
    isAvailable,
    fs,
    setFs,
    openTabs,
    activeTab,
    showArtifactsDrawer,
    openTab,
    closeTab,
    setActiveTab,
    setShowArtifactsDrawer,
    toggleArtifactsDrawer,
  };

  return (
    <ArtifactsContext.Provider value={value}>
      {children}
    </ArtifactsContext.Provider>
  );
}
