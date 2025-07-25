export interface ArtifactFile {
  path: string;
  content: Blob;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualFilesystem {
  [path: string]: ArtifactFile;
}
