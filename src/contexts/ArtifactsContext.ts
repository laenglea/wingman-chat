import { createContext } from 'react';
import { FileSystem } from '../types/file';
import { FileSystemManager } from '../lib/fs';

export interface ArtifactsContextType {
  isAvailable: boolean;
  fs: FileSystemManager;
  setFs: (filesystem: FileSystem) => void;
  openFiles: string[];
  activeFile: string | null;
  showArtifactsDrawer: boolean;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setShowArtifactsDrawer: (show: boolean) => void;
  toggleArtifactsDrawer: () => void;
}

export const ArtifactsContext = createContext<ArtifactsContextType | null>(null);
