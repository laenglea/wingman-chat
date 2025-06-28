import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Database, Search } from "lucide-react";
import { Button } from "@headlessui/react";
import { useDocuments, FileItem, FileChunk } from "../hooks/useDocuments";

export function PlaygroundPage() {
  const { files, addFile, removeFile, queryChunks } = useDocuments();
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    for (const file of Array.from(selectedFiles)) {
      await addFile(file);
    }
  }, [addFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await queryChunks(searchQuery, 5);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, queryChunks]);

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="h-full pt-16 flex overflow-hidden">
      {/* Main content area (2/3 width) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Document Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload files to extract, segment, and embed text content
          </p>
        </div>

        {/* Search Section */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through your documents..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={files.filter(f => f.status === 'completed').length === 0}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim() || files.filter(f => f.status === 'completed').length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {result.fileItem.file.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {result.similarity ? `${(result.similarity * 100).toFixed(1)}% match` : 'No similarity score'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {result.text.length > 300 ? `${result.text.substring(0, 300)}...` : result.text}
                  </p>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          ) : !searchQuery && files.filter(f => f.status === 'completed').length > 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Enter a search query to find relevant content</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Upload and process files to start searching</p>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar for file processing (1/3 width) */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Upload Area */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Upload Files
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Drag & drop or click to browse
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              PDF, DOC, TXT, MD files
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              accept=".txt,.pdf,.doc,.docx,.md"
            />
          </div>
        </div>

        {/* Files Header */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Files ({files.length})
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Database className="w-3 h-3" />
              <span>{files.filter(f => f.status === 'completed').length} processed</span>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">No files uploaded yet</p>
            </div>
          ) : (
            files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                {/* File Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getStatusIcon(fileItem.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(fileItem.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(fileItem.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Progress Bar */}
                {fileItem.status === 'processing' && (
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Processing...</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{fileItem.progress}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {fileItem.status === 'error' && fileItem.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                    {fileItem.error}
                  </div>
                )}

                {fileItem.status === 'completed' && (
                  <div className="mt-2 space-y-1">
                    {fileItem.text && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Text:</span> {fileItem.text.length} chars
                      </div>
                    )}
                    {fileItem.segments && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Segments:</span> {fileItem.segments.length} blocks
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Database className="w-3 h-3" />
                      <span>Stored in Vector DB</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
