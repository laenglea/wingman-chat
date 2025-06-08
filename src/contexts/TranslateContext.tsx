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
  
  // Data
  languages: Language[];
  selectedLanguage: Language | undefined;
  
  // Actions
  setSourceText: (text: string) => void;
  setTargetLang: (langCode: string) => void;
  performTranslate: (langCode?: string, textToTranslate?: string) => Promise<void>;
  handleReset: () => void;
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
    const textToUse = textToTranslate ?? sourceTextRef.current;

    if (!textToUse.trim()) {
      setTranslatedText("");
      return;
    }

    setIsLoading(true);
    setTranslatedText("");

    try {
      const result = await client.translate(langToUse, textToUse);
      setTranslatedText(result);
    } catch (err) {
      setTranslatedText(err instanceof Error ? err.message : "An unknown error occurred during translation.");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const handleReset = useCallback(() => {
    setSourceText("");
    setTranslatedText("");
  }, []);

  const handleSetTargetLang = useCallback(async (newLangCode: string) => {
    setTargetLang(newLangCode);
    // Automatically translate with new language if there's source text
    if (sourceTextRef.current.trim()) {
      await performTranslate(newLangCode, sourceTextRef.current);
    }
  }, [performTranslate]);

  // Auto-translate effect (3 second delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        performTranslate(targetLang, sourceText);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [sourceText, targetLang, performTranslate]);

  const contextValue: TranslateContextType = {
    // State
    sourceText,
    translatedText,
    targetLang,
    isLoading,
    
    // Data
    languages: LANGUAGES,
    selectedLanguage,
    
    // Actions
    setSourceText,
    setTargetLang: handleSetTargetLang,
    performTranslate,
    handleReset,
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
