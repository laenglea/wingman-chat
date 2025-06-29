import { useState } from 'react';
import { Plus, Folder, FileText, Upload, X, ChevronDown, Check, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button, Listbox, Menu } from '@headlessui/react';
import { useRepositories } from '../hooks/useRepositories';
import { useRepository } from '../hooks/useRepository';
import { Repository, RepositoryFile } from '../types/repository';

interface CreateRepositoryFormProps {
  onSubmit: (name: string, instructions: string) => void;
  onCancel: () => void;
}

function CreateRepositoryForm({ onSubmit, onCancel }: CreateRepositoryFormProps) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), instructions.trim());
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        Create New Repository
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter repository name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Optional instructions for this repository"
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md 
                     transition-colors cursor-pointer"
          >
            Create
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 
                     text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

interface RepositoryDetailsProps {
  repository: Repository;
}

function RepositoryDetails({ repository }: RepositoryDetailsProps) {
  const { files, addFile, removeFile } = useRepository(repository.id);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      await addFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    for (const file of selectedFiles) {
      await addFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {repository.instructions && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="text-xs text-neutral-500 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
            <strong>Instructions:</strong> {repository.instructions}
          </div>
        </div>
      )}

      {/* File upload area */}
      <div
        className={`m-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'
          }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Upload size={24} className="mx-auto mb-2 text-neutral-400" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          Drop files here or click to upload
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                   text-sm cursor-pointer"
        >
          Choose Files
        </Button>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-auto p-4">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Files ({files.length})
        </h4>
        
        {files.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
            No files uploaded yet
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {files.map((file: RepositoryFile) => (
              <div
                key={file.id}
                className="relative group"
                title={file.name}
              >
                <div className={`relative w-20 h-20 ${
                  file.status === 'processing' 
                    ? 'bg-white/30 dark:bg-black/20 backdrop-blur-lg border-2 border-dashed border-white/50 dark:border-white/30'
                    : file.status === 'error'
                    ? 'bg-red-100/40 dark:bg-red-900/25 backdrop-blur-lg border border-red-300/40 dark:border-red-600/25'
                    : 'bg-white/40 dark:bg-black/25 backdrop-blur-lg border border-white/40 dark:border-white/25'
                } rounded-xl shadow-sm flex flex-col items-center justify-center p-2 hover:shadow-md hover:border-white/60 dark:hover:border-white/40 transition-all`}>
                  
                  {file.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-500 mb-1"></div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                        {file.progress}%
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center w-full h-full">
                      <FileText size={18} className={`mb-1 flex-shrink-0 ${
                        file.status === 'error' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`} />
                      <div className={`text-xs font-medium truncate w-full leading-tight ${
                        file.status === 'error' 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-neutral-700 dark:text-neutral-200'
                      }`}>
                        {file.name}
                      </div>
                      {file.status === 'error' && (
                        <div className="text-xs mt-0.5 text-red-600 dark:text-red-400">
                          Error
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {file.status !== 'processing' && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 size-5 bg-neutral-800/80 hover:bg-neutral-900 dark:bg-neutral-200/80 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EditRepositoryFormProps {
  repository: Repository;
  onSubmit: (id: string, name: string, instructions: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

function EditRepositoryForm({ repository, onSubmit, onCancel, onDelete }: EditRepositoryFormProps) {
  const [name, setName] = useState(repository.name);
  const [instructions, setInstructions] = useState(repository.instructions || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(repository.id, name.trim(), instructions.trim());
    }
  };

  const handleDelete = () => {
    onDelete(repository.id);
    onCancel();
  };

  if (showDeleteConfirm) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Delete Repository
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Are you sure you want to delete "{repository.name}"? This action cannot be undone and will remove all files in this repository.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md 
                     transition-colors cursor-pointer"
          >
            Delete Repository
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 
                     text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        Edit Repository
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter repository name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Optional instructions for this repository"
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md 
                     transition-colors cursor-pointer"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 
                     text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </Button>
        </div>
        
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 
                     hover:text-red-700 dark:hover:text-red-300 text-sm cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Repository
          </Button>
        </div>
      </form>
    </div>
  );
}

export function RepositoryDrawer() {
  const { 
    repositories, 
    currentRepository, 
    createRepository, 
    setCurrentRepository,
    updateRepository,
    deleteRepository
  } = useRepositories();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRepository, setEditingRepository] = useState<Repository | null>(null);

  const handleCreateRepository = (name: string, instructions: string) => {
    createRepository(name, instructions || undefined);
    setShowCreateForm(false);
  };

  const handleEditRepository = (id: string, name: string, instructions: string) => {
    updateRepository(id, {
      name,
      instructions: instructions || undefined
    });
    setEditingRepository(null);
  };

  const handleDeleteRepository = async (id: string) => {
    await deleteRepository(id);
    setEditingRepository(null);
  };

  if (showCreateForm) {
    return (
      <CreateRepositoryForm
        onSubmit={handleCreateRepository}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (editingRepository) {
    return (
      <EditRepositoryForm
        repository={editingRepository}
        onSubmit={handleEditRepository}
        onCancel={() => setEditingRepository(null)}
        onDelete={handleDeleteRepository}
      />
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Repositories
          </h2>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Folder size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No Repositories Yet
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Create your first repository to organize documents and instructions
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md 
                     transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Create Repository
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Repository Selector and Menu */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Listbox value={currentRepository} onChange={(value: Repository | string | null) => {
              if (value === 'create-new') {
                setShowCreateForm(true);
              } else {
                setCurrentRepository(value as Repository);
              }
            }}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-neutral-800 py-2 pl-3 pr-10 text-left shadow-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span className="flex items-center gap-2">
                    <Folder size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="block truncate text-neutral-900 dark:text-neutral-100">
                      {currentRepository?.name || 'Select Repository'}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown size={16} className="text-neutral-400" />
                  </span>
                </Listbox.Button>
            
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {/* Create New Repository Option */}
              <Listbox.Option
                value="create-new"
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-slate-100 dark:bg-slate-700' : ''
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-slate-600 dark:text-slate-400" />
                  <span className="block truncate font-medium text-slate-600 dark:text-slate-400">
                    Create New Repository
                  </span>
                </div>
              </Listbox.Option>
              
              {/* Separator if there are existing repositories */}
              {repositories.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-600 my-1" />
              )}
              
              {/* Existing Repositories */}
              {repositories.map((repository) => (
                <Listbox.Option
                  key={repository.id}
                  value={repository}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-blue-100 dark:bg-blue-900/20' : ''
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center gap-2">
                        <Folder size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'} text-neutral-900 dark:text-neutral-100`}>
                          {repository.name}
                        </span>
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Check size={16} className="text-blue-600 dark:text-blue-400" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
              </div>
            </Listbox>
          </div>
          
          {/* 3-dot menu next to dropdown */}
          {currentRepository && (
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md transition-colors">
                <MoreVertical size={16} />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-neutral-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setEditingRepository(currentRepository)}
                        className={`${
                          active ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                        } flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300`}
                      >
                        <Edit size={14} />
                        Edit Repository
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          // Handle delete - you might want to add a confirmation
                          if (window.confirm(`Are you sure you want to delete "${currentRepository.name}"?`)) {
                            deleteRepository(currentRepository.id);
                            setCurrentRepository(null);
                          }
                        }}
                        className={`${
                          active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'
                        } flex items-center gap-2 w-full px-4 py-2 text-sm`}
                      >
                        <Trash2 size={14} />
                        Delete Repository
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          )}
        </div>
      </div>

      {/* Repository Details */}
      {currentRepository && (
        <RepositoryDetails 
          key={currentRepository.id} 
          repository={currentRepository}
        />
      )}
    </div>
  );
}
