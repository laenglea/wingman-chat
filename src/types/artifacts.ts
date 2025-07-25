export interface ArtifactFile {
  path: string;
  content: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualFilesystem {
  [path: string]: ArtifactFile;
}
