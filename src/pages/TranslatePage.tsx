import { useEffect, useRef } from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { PilcrowRightIcon, Loader2, PlusIcon, GlobeIcon, FileIcon, UploadIcon, XIcon, DownloadIcon } from "lucide-react";
import { useNavigation } from "../contexts/NavigationContext";
import { useTranslate } from "../hooks/useTranslate";
import { CopyButton } from "../components/CopyButton";

export function TranslatePage() {
  const { setRightActions } = useNavigation();
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
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Text Translation Section */}
        <div className="w-full flex-grow overflow-hidden flex items-center justify-center p-0 pt-16 xl:p-6 xl:pt-20">
          <div className="w-full h-full xl:max-w-[1200px] xl:max-h-[800px]">
            <div className="relative h-full w-full overflow-hidden border-0 bg-transparent xl:border xl:border-white/20 xl:dark:border-white/15 xl:bg-white/20 xl:dark:bg-black/15 xl:backdrop-blur-2xl xl:rounded-2xl xl:shadow-2xl xl:shadow-black/60 xl:dark:shadow-black/80">
              {/* Responsive layout: vertical stack on mobile/narrow screens, horizontal on wide screens */}
              <div className="h-full flex flex-col md:flex-row min-h-0">
                {/* Source section */}
                <div className="flex-1 flex flex-col relative min-w-0 min-h-0 overflow-hidden">
                  {/* File upload controls */}
                  <div className="absolute top-2 left-2 z-10">
                    {!selectedFile && (
                      <Button
                        onClick={handleFileUploadClick}
                        className="inline-flex items-center gap-1 pl-2 pr-3 py-2 bg-white/25 dark:bg-black/15 backdrop-blur-lg border border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-black/25 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 cursor-pointer focus:outline-none text-sm rounded-lg transition-all shadow-sm"
                        title="Select a file to translate (.docx, .pptx, .xlsx)"
                      >
                        <UploadIcon size={14} />
                        <span>Upload file</span>
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.pptx,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Show selected file in center */}
                  {selectedFile ? (
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div className="bg-white/30 dark:bg-black/20 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/40 dark:border-white/25 flex flex-col items-center gap-4 relative">
                        {/* Subtle delete button in top-right */}
                        <Button
                          onClick={handleFileClear}
                          className="absolute -top-2 -right-2 !p-1.5 !bg-white/40 dark:!bg-black/30 backdrop-blur-lg hover:!bg-white/60 dark:hover:!bg-black/40 rounded-full opacity-70 hover:opacity-100 transition-all border border-white/50 dark:border-white/30 shadow-sm"
                          title="Remove file"
                        >
                          <XIcon size={12} />
                        </Button>
                        
                        <FileIcon size={48} className="text-neutral-700 dark:text-neutral-300" />
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-center max-w-[200px] truncate">
                          {selectedFile.name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Enter text to translate..."
                      className="absolute inset-0 w-full h-full p-2 pt-12 bg-transparent border-none resize-none focus:outline-none overflow-y-auto text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                    />
                  )}
                </div>

                {/* Translate button */}
                <div className="relative flex items-center justify-center py-2 md:py-0 md:w-12 flex-shrink-0">
                  {/* Responsive divider: horizontal on mobile, vertical on desktop */}
                  <div className="absolute md:inset-y-0 md:w-px md:left-1/2 md:-translate-x-px inset-x-0 h-px md:h-auto bg-white/30 dark:bg-white/20"></div>
                  
                  <Button
                    onClick={handleTranslateButtonClick}
                    className="!bg-white/30 dark:!bg-black/20 backdrop-blur-lg border border-white/40 dark:border-white/25 hover:!bg-white/50 dark:hover:!bg-black/30 !text-neutral-700 dark:!text-neutral-300 hover:!text-neutral-900 dark:hover:!text-neutral-100 z-10 relative !p-2.5 rounded-lg shadow-lg transition-all"
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

                {/* Target section */}
                <div className="flex-1 flex flex-col relative min-w-0 min-h-0 overflow-hidden">
                  <div className="absolute top-2 left-2 z-10">
                    <Menu>
                      <MenuButton className="inline-flex items-center gap-1 pl-2 pr-3 py-2 bg-white/25 dark:bg-black/15 backdrop-blur-lg border border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-black/25 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 cursor-pointer focus:outline-none text-sm rounded-lg transition-all shadow-sm">
                        <GlobeIcon size={14} />
                        <span>
                          {selectedLanguage?.name || 'Select Language'}
                        </span>
                      </MenuButton>
                      <MenuItems
                        transition
                        anchor="bottom start"
                        className="!max-h-[50vh] mt-2 rounded-lg bg-white/20 dark:bg-black/15 backdrop-blur-2xl border border-white/30 dark:border-white/20 overflow-y-auto shadow-2xl shadow-black/60 dark:shadow-black/80 z-50"
                      >
                        {languages.map((lang) => (
                          <MenuItem key={lang.code}>
                            <Button
                              onClick={() => setTargetLang(lang.code)}
                              className="group flex w-full items-center px-4 py-2 data-[focus]:bg-white/30 dark:data-[focus]:bg-black/25 text-neutral-800 dark:text-neutral-200 cursor-pointer transition-all"
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
                    className="absolute inset-0 w-full h-full p-2 pt-12 bg-transparent border-none resize-none focus:outline-none overflow-y-auto text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                  />
                  
                  {/* Show download link for translated files */}
                  {translatedFileUrl && translatedFileName && (
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div 
                        className="bg-white/30 dark:bg-black/20 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/40 dark:border-white/25 flex flex-col items-center gap-4 cursor-pointer hover:bg-white/40 dark:hover:bg-black/30 transition-all"
                        onClick={handleDownload} 
                        title="Download translated file"
                      >
                        <div className="relative">
                          <FileIcon size={48} className="text-neutral-700 dark:text-neutral-300" />
                          {/* Simple download icon in center */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <DownloadIcon size={16} className="text-neutral-800 dark:text-neutral-200" />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-center max-w-[200px] truncate">
                          {translatedFileName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Show loading state for file translation */}
                  {selectedFile && isLoading && (
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div className="bg-white/30 dark:bg-black/20 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/40 dark:border-white/25 flex flex-col items-center gap-4">
                        <Loader2 size={48} className="animate-spin text-neutral-700 dark:text-neutral-300" />
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-center">
                          Translating...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Show candidate file when selected but not translated */}
                  {selectedFile && !isLoading && !translatedFileUrl && (
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div 
                        className="bg-white/20 dark:bg-black/10 backdrop-blur-lg border-2 border-dashed border-white/50 dark:border-white/30 p-6 rounded-xl flex flex-col items-center gap-4 cursor-pointer hover:bg-white/30 dark:hover:bg-black/20 transition-all"
                        onClick={handleTranslateButtonClick} 
                        title="Click to translate file"
                      >
                        <div className="relative">
                          <FileIcon size={48} className="text-neutral-600 dark:text-neutral-400" />
                          {/* Simple translate icon in center */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PilcrowRightIcon size={16} className="text-neutral-700 dark:text-neutral-300" />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center max-w-[200px] truncate">
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
        </div>
      </main>
    </div>
  );
}

export default TranslatePage;
