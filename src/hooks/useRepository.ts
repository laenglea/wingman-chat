import { useContext } from 'react';
import { RepositoryContext } from '../contexts/RepositoryContext';

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
