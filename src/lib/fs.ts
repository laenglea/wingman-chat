import JSZip from 'jszip';
import { FileSystem, File } from '../types/file';

// FileSystem extension methods
export class FileSystemManager {
  constructor(
    private filesystem: FileSystem,
    private setFilesystem: (fs: FileSystem) => void,
    private onFileCreated?: (path: string) => void,
    private onFileDeleted?: (path: string) => void
  ) {}

  createFile(path: string, content: string, contentType?: string): void {
    const now = new Date();
    const file: File = {
      path,
      content,
      contentType,
      createdAt: now,
      updatedAt: now,
    };

    const newFs = {
      ...this.filesystem,
      [path]: file
    };
    
    this.setFilesystem(newFs);
    this.onFileCreated?.(path);
  }

  updateFile(path: string, content: string, contentType?: string): boolean {
    const existingFile = this.filesystem[path];
    if (!existingFile) return false;

    const newFs = {
      ...this.filesystem,
      [path]: {
        ...existingFile,
        content,
        contentType,
        updatedAt: new Date(),
      }
    };
    
    this.setFilesystem(newFs);
    return true;
  }

  deleteFile(path: string): boolean {
    if (!this.filesystem[path]) return false;

    const newFs = { ...this.filesystem };
    delete newFs[path];
    this.setFilesystem(newFs);
    this.onFileDeleted?.(path);
    return true;
  }

  getFile(path: string): File | undefined {
    return this.filesystem[path];
  }

  listFiles(): File[] {
    return Object.values(this.filesystem);
  }

  fileExists(path: string): boolean {
    return path in this.filesystem;
  }

  getFileCount(): number {
    return Object.keys(this.filesystem).length;
  }

  async downloadAsZip(filename?: string): Promise<void> {
    return downloadFilesystemAsZip(this.filesystem, filename);
  }
}

export async function downloadFilesystemAsZip(
  filesystem: FileSystem, 
  filename: string = 'filesystem.zip'
): Promise<void> {
  if (Object.keys(filesystem).length === 0) {
    throw new Error('No files to download');
  }

  const zip = new JSZip();

  // Add each file to the zip
  for (const [path, file] of Object.entries(filesystem)) {
    // Remove leading slash if present for cleaner zip structure
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Add file to zip with its content
    zip.file(cleanPath, file.content);
  }

  try {
    // Generate the zip file as a blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link and trigger download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to create zip file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}