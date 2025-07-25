import { useContext } from 'react';
import { ArtifactsContext, ArtifactsContextType } from '../contexts/ArtifactsContext';

export function useArtifacts(): ArtifactsContextType {
  const context = useContext(ArtifactsContext);
  
  if (!context) {
    throw new Error('useArtifacts must be used within an ArtifactsProvider');
  }
  
  return context;
}
