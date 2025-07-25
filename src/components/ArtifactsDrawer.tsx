import { useState } from 'react';
import { X, FileText, Code, Folder, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@headlessui/react';
import { useArtifacts } from '../hooks/useArtifacts';

// Helper function to get file extension and determine language
function getFileLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sql':
      return 'sql';
    case 'sh':
      return 'bash';
    default:
      return 'text';
  }
}

// Helper function to get file icon based on language
function getFileIcon(language: string) {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'go':
    case 'python':
    case 'rust':
    case 'java':
    case 'cpp':
    case 'c':
      return <Code size={16} className="text-blue-600 dark:text-blue-400" />;
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'yaml':
      return <FileText size={16} className="text-green-600 dark:text-green-400" />;
    case 'markdown':
      return <FileText size={16} className="text-orange-600 dark:text-orange-400" />;
    default:
      return <FileText size={16} className="text-neutral-600 dark:text-neutral-400" />;
  }
}

// Helper function to extract filename from path
function getFilename(path: string): string {
  return path.split('/').pop() || path;
}

// Helper function to extract directory from path
function getDirectory(path: string): string {
  const parts = path.split('/');
  return parts.slice(0, -1).join('/') || '/';
}

export function ArtifactsDrawer() {
  const { 
    filesystem, 
    openTabs, 
    activeTab, 
    openTab, 
    closeTab, 
    setActiveTab,
    deleteFile,
    getFile 
  } = useArtifacts();

  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set(['/']));

  // Get all files sorted by path
  const allFiles = Object.values(filesystem).sort((a, b) => a.path.localeCompare(b.path));

  // Build directory tree structure
  const directoryTree = new Map<string, string[]>();
  allFiles.forEach(file => {
    const dir = getDirectory(file.path);
    if (!directoryTree.has(dir)) {
      directoryTree.set(dir, []);
    }
    directoryTree.get(dir)!.push(file.path);
  });

  // Get all directories and sort them
  const allDirectories = Array.from(directoryTree.keys()).sort();

  const toggleDirectory = (dir: string) => {
    setExpandedDirectories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dir)) {
        newSet.delete(dir);
      } else {
        newSet.add(dir);
      }
      return newSet;
    });
  };

  const handleTabClick = (path: string) => {
    if (activeTab === path) {
      // If already active, don't change
      return;
    }
    setActiveTab(path);
  };

  const handleDeleteFile = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${getFilename(path)}"?`)) {
      deleteFile(path);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Artifacts
            </h2>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Open Tabs */}
      {openTabs.length > 0 && (
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto scrollbar-hide">
            {openTabs.map((path) => {
              const file = getFile(path);
              if (!file) return null;
              
              const filename = getFilename(path);
              const language = file.language || getFileLanguage(path);
              const isActive = activeTab === path;

              return (
                <Button
                  key={path}
                  onClick={() => handleTabClick(path)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm border-r border-neutral-200 dark:border-neutral-700 min-w-0 flex-shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                  } transition-colors`}
                >
                  {getFileIcon(language)}
                  <span className="truncate max-w-[120px]" title={filename}>
                    {filename}
                  </span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(path);
                    }}
                    className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                    <X size={12} />
                  </Button>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {allFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No Files Created
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Files created by the AI will appear here
            </p>
          </div>
        ) : (
          <div className="p-2">
            {allDirectories.map((directory) => {
              const isExpanded = expandedDirectories.has(directory);
              const filesInDir = directoryTree.get(directory) || [];
              const dirName = directory === '/' ? 'Root' : directory.split('/').pop() || directory;

              return (
                <div key={directory} className="mb-2">
                  {/* Directory Header */}
                  <Button
                    onClick={() => toggleDirectory(directory)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    <Folder size={16} className="text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {dirName}
                    </span>
                    {filesInDir.length > 0 && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
                        {filesInDir.length}
                      </span>
                    )}
                  </Button>

                  {/* Files in Directory */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {filesInDir.map((path) => {
                        const file = getFile(path);
                        if (!file) return null;

                        const filename = getFilename(path);
                        const language = file.language || getFileLanguage(path);
                        const isTabOpen = openTabs.includes(path);

                        return (
                          <div
                            key={path}
                            className="group flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            <Button
                              onClick={() => openTab(path)}
                              className="flex items-center gap-2 flex-1 text-left min-w-0"
                            >
                              {getFileIcon(language)}
                              <span 
                                className={`text-sm truncate ${
                                  isTabOpen 
                                    ? 'font-medium text-neutral-900 dark:text-neutral-100' 
                                    : 'text-neutral-700 dark:text-neutral-300'
                                }`}
                                title={filename}
                              >
                                {filename}
                              </span>
                            </Button>

                            {/* File Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => openTab(path)}
                                className="p-1 text-neutral-400 hover:text-slate-600 dark:hover:text-slate-400 rounded transition-colors"
                                title="Open file"
                              >
                                <Edit3 size={12} />
                              </Button>
                              <Button
                                onClick={(e) => handleDeleteFile(path, e)}
                                className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                title="Delete file"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active File Content Preview */}
      {activeTab && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 max-h-[40%] overflow-hidden">
          <div className="p-3">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Preview: {getFilename(activeTab)}
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3 max-h-[200px] overflow-auto">
              <pre className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
                {getFile(activeTab)?.content.slice(0, 500)}
                {(getFile(activeTab)?.content.length || 0) > 500 && '...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
