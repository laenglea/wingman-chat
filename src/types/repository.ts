export interface Repository {
  id: string;
  name: string;
  instructions?: string; // instruction for this repository
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryFile {
  id: string;
  repositoryId: string;
  name: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  text?: string;
  segments?: Array<{
    text: string;
    vector: number[];
  }>;
  error?: string;
  uploadedAt: Date;
}
