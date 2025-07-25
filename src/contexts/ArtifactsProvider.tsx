import { useState, useCallback, ReactNode } from 'react';
import { ArtifactsContext } from './ArtifactsContext';
import { ArtifactFile, VirtualFilesystem } from '../types/artifacts';
import { Tool } from '../types/chat';

interface ArtifactsProviderProps {
  children: ReactNode;
}

export function ArtifactsProvider({ children }: ArtifactsProviderProps) {
  const [filesystem, setFilesystem] = useState<VirtualFilesystem>({});
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showArtifactsDrawer, setShowArtifactsDrawer] = useState(false);

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

  const createFile = useCallback((path: string, content: string, language?: string) => {
    const now = new Date();
    const file: ArtifactFile = {
      path,
      content,
      language,
      createdAt: now,
      updatedAt: now,
    };

    setFilesystem(prev => ({
      ...prev,
      [path]: file
    }));

    // Auto-open the newly created file
    openTab(path);
  }, [openTab]);

  const updateFile = useCallback((path: string, content: string) => {
    setFilesystem(prev => {
      const existingFile = prev[path];
      if (!existingFile) return prev;

      return {
        ...prev,
        [path]: {
          ...existingFile,
          content,
          updatedAt: new Date(),
        }
      };
    });
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFilesystem(prev => {
      const newFs = { ...prev };
      delete newFs[path];
      return newFs;
    });

    // Close tab if it's open
    closeTab(path);
  }, [closeTab]);

  const getFile = useCallback((path: string): ArtifactFile | undefined => {
    return filesystem[path];
  }, [filesystem]);

  const toggleArtifactsDrawer = useCallback(() => {
    setShowArtifactsDrawer(prev => !prev);
  }, []);

  const artifactsTools: Tool[] = [
    {
      name: 'create_file',
      description: 'Create a new file in the virtual filesystem with the specified path and content.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path (e.g., /projects/test.go, /src/index.js). Should start with / and include the full directory structure.'
          },
          content: {
            type: 'string',
            description: 'The content of the file to create.'
          },
          language: {
            type: 'string',
            description: 'Optional programming language for syntax highlighting (e.g., javascript, typescript, go, python, etc.)'
          }
        },
        required: ['path', 'content']
      },
      function: async (args: Record<string, unknown>): Promise<string> => {
        const path = args.path as string;
        const content = args.content as string;
        const language = args.language as string | undefined;

        console.log(`📄 Creating file: ${path}`);

        if (!path || !content) {
          return JSON.stringify({ error: 'Path and content are required' });
        }

        // Validate path format
        if (!path.startsWith('/')) {
          return JSON.stringify({ error: 'Path must start with /' });
        }

        try {
          createFile(path, content, language);
          console.log(`✅ File created successfully: ${path}`);
          return JSON.stringify({ 
            success: true, 
            message: `File created: ${path}`,
            path 
          });
        } catch (error) {
          console.error('❌ Failed to create file:', error);
          return JSON.stringify({ error: 'Failed to create file' });
        }
      }
    }
  ];

  const value = {
    filesystem,
    openTabs,
    activeTab,
    showArtifactsDrawer,
    createFile,
    updateFile,
    deleteFile,
    openTab,
    closeTab,
    setActiveTab,
    getFile,
    setShowArtifactsDrawer,
    toggleArtifactsDrawer,
    artifactsTools,
  };

  return (
    <ArtifactsContext.Provider value={value}>
      {children}
    </ArtifactsContext.Provider>
  );
}
