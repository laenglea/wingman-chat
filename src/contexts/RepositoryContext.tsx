import { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Repository } from '../types/repository';
import { setValue, getValue } from '../lib/db';
import { cleanupRepositoryData } from '../hooks/useRepositoryDocuments';

type RepositoryContextType = {
  repositories: Repository[];
  currentRepository: Repository | null;
  createRepository: (name: string, instructions?: string) => void;
  updateRepository: (id: string, updates: Partial<Omit<Repository, 'id' | 'createdAt'>>) => void;
  deleteRepository: (id: string) => Promise<void>;
  setCurrentRepository: (repository: Repository | null) => void;
  showRepositoryDrawer: boolean;
  setShowRepositoryDrawer: (show: boolean) => void;
  toggleRepositoryDrawer: () => void;
};

export const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

const REPOSITORIES_DB_KEY = 'repositories';
const CURRENT_REPOSITORY_DB_KEY = 'currentRepository';

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(null);
  const [showRepositoryDrawer, setShowRepositoryDrawer] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load repositories from database on mount
  useEffect(() => {
    const loadRepositories = async () => {
      try {
        const savedRepositories = await getValue<Repository[]>(REPOSITORIES_DB_KEY);
        const savedCurrentRepository = await getValue<Repository>(CURRENT_REPOSITORY_DB_KEY);
        
        if (savedRepositories) {
          // Parse dates from stored data
          const repositoriesWithDates = savedRepositories.map(repo => ({
            ...repo,
            createdAt: new Date(repo.createdAt),
            updatedAt: new Date(repo.updatedAt),
          }));
          
          setRepositories(repositoriesWithDates);
          
          // Restore current repository if it exists in the loaded repositories
          if (savedCurrentRepository) {
            const currentRepoWithDates = {
              ...savedCurrentRepository,
              createdAt: new Date(savedCurrentRepository.createdAt),
              updatedAt: new Date(savedCurrentRepository.updatedAt),
            };
            
            const repoExists = repositoriesWithDates.some(r => r.id === currentRepoWithDates.id);
            if (repoExists) {
              setCurrentRepository(currentRepoWithDates);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load repositories from database:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadRepositories();
  }, []);

  // Save repositories to database whenever they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load
    
    const saveRepositories = async () => {
      try {
        await setValue(REPOSITORIES_DB_KEY, repositories);
      } catch (error) {
        console.error('Failed to save repositories to database:', error);
      }
    };

    saveRepositories();
  }, [repositories, isLoaded]);

  // Save current repository to database whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load
    
    const saveCurrentRepository = async () => {
      try {
        if (currentRepository) {
          await setValue(CURRENT_REPOSITORY_DB_KEY, currentRepository);
        } else {
          // Clear saved current repository if none is selected
          await setValue(CURRENT_REPOSITORY_DB_KEY, null);
        }
      } catch (error) {
        console.error('Failed to save current repository to database:', error);
      }
    };

    saveCurrentRepository();
  }, [currentRepository, isLoaded]);

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

  const deleteRepository = useCallback(async (id: string) => {
    setRepositories(prev => prev.filter(repo => repo.id !== id));
    
    // Clear current repository if it's the one being deleted
    if (currentRepository?.id === id) {
      setCurrentRepository(null);
    }
    
    // Clean up repository data (files, vector DB, etc.)
    await cleanupRepositoryData(id);
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
