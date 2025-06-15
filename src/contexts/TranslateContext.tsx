import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { getConfig } from "../config";

// Types
export interface Language {
  code: string;
  name: string;
}

export interface TranslateContextType {
  // State
  sourceText: string;
  translatedText: string;
  targetLang: string;
  isLoading: boolean;
  selectedFile: File | null;
  translatedFileUrl: string | null;
  translatedFileName: string | null;
  
  // Data
  languages: Language[];
  selectedLanguage: Language | undefined;
  
  // Actions
  setSourceText: (text: string) => void;
  setTargetLang: (langCode: string) => void;
  performTranslate: (langCode?: string, textToTranslate?: string) => Promise<void>;
  handleReset: () => void;
  selectFile: (file: File) => void;
  clearFile: () => void;
}

const TranslateContext = createContext<TranslateContextType | undefined>(undefined);

// Available languages
const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "es", name: "Spanish" },
];

interface TranslateProviderProps {
  children: ReactNode;
}

export function TranslateProvider({ children }: TranslateProviderProps) {
  const config = getConfig();
  const client = config.client;

  // State
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [translatedFileUrl, setTranslatedFileUrl] = useState<string | null>(null);
  const [translatedFileName, setTranslatedFileName] = useState<string | null>(null);

  // Refs for stable references
  const sourceTextRef = useRef(sourceText);
  const targetLangRef = useRef(targetLang);

  // Update refs when state changes
  useEffect(() => {
    sourceTextRef.current = sourceText;
  }, [sourceText]);

  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);

  // Derived state
  const selectedLanguage = LANGUAGES.find(l => l.code === targetLang);

  // Actions with stable references
  const performTranslate = useCallback(async (langCode?: string, textToTranslate?: string) => {
    const langToUse = langCode ?? targetLangRef.current;
    
    // Handle file translation if a file is selected
    if (selectedFile) {
      setIsLoading(true);
      try {
        const translatedBlob = await client.translate(langToUse, selectedFile);
        
        if (translatedBlob instanceof Blob) {
          // Create download URL
          const url = URL.createObjectURL(translatedBlob);
          
          // Generate filename with language suffix
          const originalName = selectedFile.name;
          const lastDotIndex = originalName.lastIndexOf('.');
          const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
          const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
          const translatedFileName = `${nameWithoutExt}_${langToUse}${extension}`;
          
          // Set download URL and filename for display
          setTranslatedFileUrl(url);
          setTranslatedFileName(translatedFileName);
          
          // Auto-download the file
          const link = document.createElement('a');
          link.href = url;
          link.download = translatedFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error('File translation failed:', err);
        // Could add error state here if needed
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Handle text translation
    const textToUse = textToTranslate ?? sourceTextRef.current;

    if (!textToUse.trim()) {
      setTranslatedText("");
      return;
    }

    setIsLoading(true);
    setTranslatedText("");

    try {
      const result = await client.translate(langToUse, textToUse);
      if (typeof result === 'string') {
        setTranslatedText(result);
      }
    } catch (err) {
      setTranslatedText(err instanceof Error ? err.message : "An unknown error occurred during translation.");
    } finally {
      setIsLoading(false);
    }
  }, [client, selectedFile]);

  const handleReset = useCallback(() => {
    setSourceText("");
    setTranslatedText("");
    setSelectedFile(null);
    setTranslatedFileUrl(null);
    setTranslatedFileName(null);
  }, []);

  const handleSetTargetLang = useCallback(async (newLangCode: string) => {
    setTargetLang(newLangCode);
    
    // If there's a selected file, clear translation results to show candidate state
    if (selectedFile) {
      setTranslatedFileUrl(null);
      setTranslatedFileName(null);
    }
    
    // Automatically translate with new language if there's source text (but not if file is selected)
    if (sourceTextRef.current.trim() && !selectedFile) {
      await performTranslate(newLangCode, sourceTextRef.current);
    }
  }, [performTranslate, selectedFile]);

  // Auto-translate effect (3 second delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim() && !selectedFile) {
        performTranslate(targetLang, sourceText);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [sourceText, targetLang, performTranslate, selectedFile]);

  const selectFile = useCallback((file: File) => {
    setSelectedFile(file);
    // Clear any previous file translation results
    setTranslatedFileUrl(null);
    setTranslatedFileName(null);
    // Clear text translation output
    setTranslatedText("");
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setTranslatedFileUrl(null);
    setTranslatedFileName(null);
  }, []);

  const contextValue: TranslateContextType = {
    // State
    sourceText,
    translatedText,
    targetLang,
    isLoading,
    selectedFile,
    translatedFileUrl,
    translatedFileName,
    
    // Data
    languages: LANGUAGES,
    selectedLanguage,
    
    // Actions
    setSourceText,
    setTargetLang: handleSetTargetLang,
    performTranslate,
    handleReset,
    selectFile,
    clearFile,
  };

  return (
    <TranslateContext.Provider value={contextValue}>
      {children}
    </TranslateContext.Provider>
  );
}

export function useTranslate() {
  const context = useContext(TranslateContext);
  if (context === undefined) {
    throw new Error("useTranslate must be used within a TranslateProvider");
  }
  return context;
}
