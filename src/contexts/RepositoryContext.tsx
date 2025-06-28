import { createContext, useState, useCallback, ReactNode } from 'react';
import { Repository } from '../types/repository';

type RepositoryContextType = {
  repositories: Repository[];
  currentRepository: Repository | null;
  createRepository: (name: string, instructions?: string) => void;
  updateRepository: (id: string, updates: Partial<Omit<Repository, 'id' | 'createdAt'>>) => void;
  deleteRepository: (id: string) => void;
  setCurrentRepository: (repository: Repository | null) => void;
  showRepositoryDrawer: boolean;
  setShowRepositoryDrawer: (show: boolean) => void;
  toggleRepositoryDrawer: () => void;
};

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(null);
  const [showRepositoryDrawer, setShowRepositoryDrawer] = useState(false);

  const createRepository = useCallback((name: string, instructions?: string) => {
    const newRepository: Repository = {
      id: crypto.randomUUID(),
      name,
      instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setRepositories(prev => [...prev, newRepository]);
    setCurrentRepository(newRepository);
  }, []);

  const updateRepository = useCallback((id: string, updates: Partial<Omit<Repository, 'id' | 'createdAt'>>) => {
    setRepositories(prev => prev.map(repo => 
      repo.id === id 
        ? { ...repo, ...updates, updatedAt: new Date() }
        : repo
    ));
    
    // Update current repository if it's the one being updated
    if (currentRepository?.id === id) {
      setCurrentRepository(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [currentRepository]);

  const deleteRepository = useCallback((id: string) => {
    setRepositories(prev => prev.filter(repo => repo.id !== id));
    
    // Clear current repository if it's the one being deleted
    if (currentRepository?.id === id) {
      setCurrentRepository(null);
    }
  }, [currentRepository]);

  const toggleRepositoryDrawer = useCallback(() => {
    setShowRepositoryDrawer(prev => !prev);
  }, []);

  return (
    <RepositoryContext.Provider
      value={{
        repositories,
        currentRepository,
        createRepository,
        updateRepository,
        deleteRepository,
        setCurrentRepository,
        showRepositoryDrawer,
        setShowRepositoryDrawer,
        toggleRepositoryDrawer,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export { RepositoryContext };
