import { useEffect, useRef } from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { PilcrowRightIcon, Loader2, PlusIcon, GlobeIcon, Maximize2, Minimize2, FileIcon, UploadIcon, XIcon, DownloadIcon } from "lucide-react";
import { useNavigation } from "../contexts/NavigationContext";
import { useResponsiveness } from "../hooks/useResponsiveness";
import { useTranslate } from "../hooks/useTranslate";
import { CopyButton } from "../components/CopyButton";

export function TranslatePage() {
  const { setRightActions } = useNavigation();
  const { isResponsive, toggleResponsiveness } = useResponsiveness();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use translate context
  const {
    sourceText,
    translatedText,
    isLoading,
    languages,
    selectedLanguage,
    selectedFile,
    translatedFileUrl,
    translatedFileName,
    setSourceText,
    setTargetLang,
    performTranslate,
    handleReset,
    selectFile,
    clearFile
  } = useTranslate();

  const handleTranslateButtonClick = () => {
    performTranslate();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file type is allowed
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
      ];
      
      if (allowedTypes.includes(file.type)) {
        selectFile(file);
      } else {
        alert('Please select a valid file type: .docx, .pptx, or .xlsx');
      }
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileClear = () => {
    clearFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (translatedFileUrl && translatedFileName) {
      const link = document.createElement('a');
      link.href = translatedFileUrl;
      link.download = translatedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Generate candidate filename for display
  const getCandidateFileName = () => {
    if (!selectedFile || !selectedLanguage) return '';
    const originalName = selectedFile.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
    return `${nameWithoutExt}_${selectedLanguage.code}${extension}`;
  };

  // Set up navigation actions when component mounts
  useEffect(() => {
    setRightActions(
      <Button
        className="menu-button"
        onClick={handleReset}
        title="Clear translation"
      >
        <PlusIcon size={20} />
      </Button>
    );

    // Cleanup when component unmounts
    return () => {
      setRightActions(null);
    };
  }, [setRightActions, handleReset]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {/* Toggle button - positioned at page level */}
      <div className="hidden md:block absolute top-4 right-4 z-20">
        <Button
          onClick={toggleResponsiveness}
          className="menu-button !p-1.5"
          title={isResponsive ? "Switch to fixed width (900px)" : "Switch to responsive mode (80%/80%)"}
        >
          {isResponsive ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Text Translation Section */}
        <div className="w-full flex-grow py-0 px-0 md:py-4 md:px-3 pb-safe-bottom overflow-hidden flex items-center justify-center">
          <div className={`w-full md:mx-auto ${
            isResponsive 
              ? 'h-full md:h-[80vh] md:max-w-[80vw] md:aspect-[3/2]' 
              : 'h-full md:h-auto md:max-w-[900px] md:aspect-[3/2]'
          }`}>
            <div className="relative h-full w-full border-0 md:border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 rounded-none md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-none md:shadow-md">
            <div className="flex-1 flex flex-col relative">
              {/* File upload controls */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                {!selectedFile && (
                  <>
                    <Button
                      onClick={handleFileUploadClick}
                      className="menu-button !p-1.5"
                      title="Select a file to translate (.docx, .pptx, .xlsx)"
                    >
                      <UploadIcon size={14} />
                    </Button>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                      Upload file
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.pptx,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              
              {/* Show selected file in center */}
              {selectedFile ? (
                <div className="absolute inset-2 flex items-center justify-center">
                  <div className="bg-neutral-300 dark:bg-neutral-700 p-4 rounded-lg shadow-lg flex flex-col items-center gap-3 relative">
                    {/* Subtle delete button in top-right */}
                    <Button
                      onClick={handleFileClear}
                      className="absolute -top-2 -right-2 !p-1 !bg-neutral-400 dark:!bg-neutral-600 hover:!bg-neutral-500 dark:hover:!bg-neutral-500 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                      title="Remove file"
                    >
                      <XIcon size={12} />
                    </Button>
                    
                    <FileIcon size={48} className="text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center max-w-[200px] truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                </div>
              ) : (
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="w-full h-full p-2 md:pt-12 bg-transparent border-none resize-none focus:outline-none ios-scroll"
                />
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="hidden md:block absolute inset-y-0 w-px bg-neutral-300 dark:bg-neutral-600"></div>
              <div className="block md:hidden absolute inset-x-0 h-px bg-neutral-300 dark:bg-neutral-600"></div>
              
              <Button
                onClick={handleTranslateButtonClick}
                className="menu-button !bg-neutral-400 dark:!bg-neutral-900 z-10 relative"
                title={selectedFile ? `Translate file to ${selectedLanguage?.name || 'Selected Language'}` : `Translate to ${selectedLanguage?.name || 'Selected Language'}`}
                disabled={
                  isLoading || 
                  (selectedFile ? !selectedLanguage : !sourceText.trim())
                }
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <PilcrowRightIcon />
                )}
              </Button>
            </div>

            <div className="flex-1 flex flex-col relative">
              <div className="absolute top-2 left-2 z-10">
                <Menu>
                  <MenuButton className="inline-flex items-center gap-1 pl-0 pr-1.5 py-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:outline-none text-sm">
                    <GlobeIcon size={14} />
                    <span>
                      {selectedLanguage?.name || 'Select Language'}
                    </span>
                  </MenuButton>
                  <MenuItems
                    transition
                    anchor="bottom start"
                    className="!max-h-[50vh] mt-2 rounded border bg-neutral-200 dark:bg-neutral-900 border-neutral-700 overflow-y-auto shadow-lg z-50"
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.code}>
                        <Button
                          onClick={() => setTargetLang(lang.code)}
                          className="group flex w-full items-center px-4 py-2 data-[focus]:bg-neutral-300 dark:text-neutral-200 dark:data-[focus]:bg-[#2c2c2e] cursor-pointer"
                        >
                          {lang.name}
                        </Button>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
              <textarea
                value={translatedText}
                readOnly
                placeholder={selectedFile ? "" : "Translation will appear here..."}
                className="w-full h-full p-2 pt-12 bg-transparent border-none resize-none focus:outline-none ios-scroll"
              />
              
              {/* Show download link for translated files */}
              {translatedFileUrl && translatedFileName && (
                <div className="absolute inset-2 flex items-center justify-center">
                  <div 
                    className="bg-neutral-300 dark:bg-neutral-700 p-4 rounded-lg shadow-lg flex flex-col items-center gap-3 cursor-pointer hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
                    onClick={handleDownload} 
                    title="Download translated file"
                  >
                    <div className="relative">
                      <FileIcon size={48} className="text-neutral-600 dark:text-neutral-400" />
                      {/* Simple download icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <DownloadIcon size={16} className="text-neutral-800 dark:text-neutral-200" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center max-w-[200px] truncate">
                      {translatedFileName}
                    </span>
                  </div>
                </div>
              )}

              {/* Show loading state for file translation */}
              {selectedFile && isLoading && (
                <div className="absolute inset-2 flex items-center justify-center">
                  <div className="bg-neutral-300 dark:bg-neutral-700 p-4 rounded-lg shadow-lg flex flex-col items-center gap-3">
                    <Loader2 size={48} className="animate-spin text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center">
                      Translating...
                    </span>
                  </div>
                </div>
              )}

              {/* Show candidate file when selected but not translated */}
              {selectedFile && !isLoading && !translatedFileUrl && (
                <div className="absolute inset-2 flex items-center justify-center">
                  <div 
                    className="bg-neutral-100 dark:bg-neutral-900 border-2 border-dashed border-neutral-400 dark:border-neutral-600 p-4 rounded-lg flex flex-col items-center gap-3 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    onClick={handleTranslateButtonClick} 
                    title="Click to translate file"
                  >
                    <div className="relative">
                      <FileIcon size={48} className="text-neutral-500 dark:text-neutral-500" />
                      {/* Simple translate icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PilcrowRightIcon size={16} className="text-neutral-700 dark:text-neutral-300" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center max-w-[200px] truncate">
                      {getCandidateFileName()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show copy button for text translations */}
              {translatedText && !selectedFile && (
                <div className="absolute top-2 right-2">
                  <CopyButton text={translatedText} />
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TranslatePage;
