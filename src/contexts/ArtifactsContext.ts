import { createContext } from 'react';
import { FileSystem } from '../types/file';
import { FileSystemManager } from '../lib/fs';

export interface ArtifactsContextType {
  isAvailable: boolean;
  fs: FileSystemManager;
  setFs: (filesystem: FileSystem) => void;
  openTabs: string[];
  activeTab: string | null;
  showArtifactsDrawer: boolean;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string | null) => void;
  setShowArtifactsDrawer: (show: boolean) => void;
  toggleArtifactsDrawer: () => void;
}

export const ArtifactsContext = createContext<ArtifactsContextType | null>(null);
