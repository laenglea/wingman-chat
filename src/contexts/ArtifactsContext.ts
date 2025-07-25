import { createContext } from 'react';
import { ArtifactFile, VirtualFilesystem } from '../types/artifacts';
import { Tool } from '../types/chat';

export interface ArtifactsContextType {
  filesystem: VirtualFilesystem;
  openTabs: string[];
  activeTab: string | null;
  showArtifactsDrawer: boolean;
  createFile: (path: string, content: string, language?: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string | null) => void;
  getFile: (path: string) => ArtifactFile | undefined;
  setShowArtifactsDrawer: (show: boolean) => void;
  toggleArtifactsDrawer: () => void;
  artifactsTools: Tool[];
}

export const ArtifactsContext = createContext<ArtifactsContextType | null>(null);
