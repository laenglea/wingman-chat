import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Database, Search } from "lucide-react";
import { Button } from "@headlessui/react";
import { Client } from "../lib/client";
import { QueryResult } from "../lib/vectordb";
import { useDocuments, FileItem } from "../contexts/DocumentContext";

export function PlaygroundPage() {
  const { files, vectorDB, addFiles, removeFile, processFile, processAllFiles } = useDocuments();
  const [isDragOver, setIsDragOver] = useState(false);
  const [client] = useState(() => new Client());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QueryResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    addFiles(selectedFiles);
  }, [addFiles]);

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
      // Generate embedding for search query
      const queryVector = await client.embedText(searchQuery);
      
      // Search the vector database
      const results = vectorDB.queryDocuments('playground', queryVector, undefined, 5);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, vectorDB, client]);

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
    <div className="h-full pt-16 px-4 pb-4 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Document Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload files to extract, segment, and embed text content
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Upload Files
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            accept=".txt,.pdf,.doc,.docx,.md"
          />
        </div>

        {/* Process All Button */}
        {files.length > 0 && files.some(f => f.status === 'pending') && (
          <div className="text-center">
            <Button
              onClick={processAllFiles}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Process All Files
            </Button>
          </div>
        )}

        {/* Search Section */}
        {files.some(f => f.storedInVectorDB) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Search Documents
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search query..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Search Results ({searchResults.length})
                </h4>
                {searchResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {result.document.source}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(result.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.document.text.substring(0, 150)}
                      {result.document.text.length > 150 && '...'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Files ({files.length})
              </h2>
              
              {/* Vector DB Summary */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Database className="w-4 h-4" />
                <span>
                  {files.filter(f => f.storedInVectorDB).length} stored in Vector DB
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(fileItem.status)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(fileItem.file.size / 1024).toFixed(1)} KB • {fileItem.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileItem.status === 'pending' && (
                        <Button
                          onClick={() => processFile(fileItem.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Process
                        </Button>
                      )}
                      <Button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {fileItem.status === 'processing' && (
                    <div className="mb-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {fileItem.progress}% complete
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {fileItem.status === 'error' && fileItem.error && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {fileItem.error}
                      </p>
                    </div>
                  )}

                  {/* Results */}
                  {fileItem.status === 'completed' && (
                    <div className="space-y-3">
                      {fileItem.extractedText && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Extracted Text ({fileItem.extractedText.length} characters)
                          </h4>
                          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-20 overflow-y-auto">
                            {fileItem.extractedText.substring(0, 200)}
                            {fileItem.extractedText.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                      
                      {fileItem.segments && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Segments ({fileItem.segments.length} blocks)
                          </h4>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {fileItem.segments.map((segment, index) => (
                              <div key={index} className="mb-1">
                                Segment {index + 1}: {segment.text.substring(0, 50)}
                                {segment.text.length > 50 && '...'}
                                <span className="text-gray-400"> (vector: {segment.vector.length}d)</span>
                              </div>
                            ))}
                          </div>
                          
                          {fileItem.storedInVectorDB && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <Database className="w-4 h-4" />
                              <span>Stored in Vector Database</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
