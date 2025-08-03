import JSZip from 'jszip';
import { FileSystem, File } from '../types/file';

// FileSystem extension methods
export class FileSystemManager {
  constructor(
    private filesystem: FileSystem,
    private setFilesystem: (fs: FileSystem) => void,
    private onFileCreated?: (path: string) => void,
    private onFileDeleted?: (path: string) => void,
    private onFileRenamed?: (oldPath: string, newPath: string) => void
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
    // Check if this is a direct file
    const isFile = this.filesystem[path];
    
    if (isFile) {
      // Handle single file deletion
      const newFs = { ...this.filesystem };
      delete newFs[path];
      this.setFilesystem(newFs);
      this.onFileDeleted?.(path);
      return true;
    }

    // Check if this is a folder (has files that start with path + '/')
    const affectedFiles = this.listFiles().filter(file => 
      file.path.startsWith(path + '/')
    );

    if (affectedFiles.length > 0) {
      // Handle folder deletion - delete all files within the folder
      const newFs = { ...this.filesystem };
      
      for (const file of affectedFiles) {
        delete newFs[file.path];
      }
      
      this.setFilesystem(newFs);
      
      // Call the callback for each deleted file
      for (const file of affectedFiles) {
        this.onFileDeleted?.(file.path);
      }
      
      return true;
    }

    // Path doesn't exist as file or folder
    return false;
  }

  renameFile(oldPath: string, newPath: string): boolean {
    // Check if the old path exists (either as a file or folder)
    const isFile = this.filesystem[oldPath];
    const isFolder = this.listFiles().some(file => file.path.startsWith(oldPath + '/'));
    
    if (!isFile && !isFolder) {
      return false; // Path doesn't exist
    }

    if (this.filesystem[newPath]) {
      return false; // New path already exists
    }

    const newFs = { ...this.filesystem };

    if (isFile) {
      // Handle file rename
      const file = this.filesystem[oldPath];
      newFs[newPath] = {
        ...file,
        path: newPath,
        updatedAt: new Date(),
      };
      delete newFs[oldPath];
      
      this.setFilesystem(newFs);
      this.onFileRenamed?.(oldPath, newPath);
      return true;
    } else if (isFolder) {
      // Handle folder rename - rename all files within the folder
      const affectedFiles = this.listFiles().filter(file => 
        file.path.startsWith(oldPath + '/')
      );

      for (const file of affectedFiles) {
        const relativePath = file.path.substring(oldPath.length);
        const newFilePath = newPath + relativePath;
        
        newFs[newFilePath] = {
          ...file,
          path: newFilePath,
          updatedAt: new Date(),
        };
        delete newFs[file.path];
      }

      this.setFilesystem(newFs);
      
      // Call the callback for each renamed file
      for (const file of affectedFiles) {
        const relativePath = file.path.substring(oldPath.length);
        const newFilePath = newPath + relativePath;
        this.onFileRenamed?.(file.path, newFilePath);
      }
      
      return true;
    }

    return false;
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