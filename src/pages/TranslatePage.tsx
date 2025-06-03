import { useState, useEffect, useCallback } from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { PilcrowRightIcon, Loader2, PlusIcon, GlobeIcon, Maximize2, Minimize2 } from "lucide-react";
import { getConfig } from "../config";
import { useNavigation } from "../contexts/NavigationContext";
import { useResponsiveness } from "../hooks/useResponsiveness";
import { CopyButton } from "../components/CopyButton";

const languages = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "es", name: "Spanish" },
];

export function TranslatePage() {
  const config = getConfig();
  const client = config.client;
  const { setRightActions } = useNavigation();

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const { isResponsive, toggleResponsiveness } = useResponsiveness();

  const performTranslate = useCallback(async (langToUse: string, textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      setTranslatedText("");
      return;
    }

    setIsLoading(true);
    setTranslatedText("");

    try {
      const result = await client.translate(langToUse, textToTranslate);
      setTranslatedText(result);
    } catch (err) {
      setTranslatedText(err instanceof Error ? err.message : "An unknown error occurred during translation.");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        performTranslate(targetLang, sourceText);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [sourceText, targetLang, performTranslate]);

  const handleTranslateButtonClick = () => {
    performTranslate(targetLang, sourceText);
  };

  const handleLanguageChange = (newLangCode: string) => {
    setTargetLang(newLangCode);

    (async () => {
      await performTranslate(newLangCode, sourceText);
    })();
  };

  const handleReset = useCallback(() => {
    setSourceText("");
    setTranslatedText("");
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleReset]);

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
        <div className="w-full flex-grow py-0 px-0 md:py-4 md:px-3 pb-safe-bottom overflow-hidden flex items-center justify-center">
          <div className={`w-full md:mx-auto ${
            isResponsive 
              ? 'h-full md:h-[80vh] md:max-w-[80vw] md:aspect-[3/2]' 
              : 'h-full md:h-auto md:max-w-[900px] md:aspect-[3/2]'
          }`}>
            <div className="relative h-full w-full border-0 md:border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 rounded-none md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-none md:shadow-md">
            <div className="flex-1 flex flex-col relative">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-full p-2 md:pt-12 bg-transparent border-none resize-none focus:outline-none ios-scroll"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="hidden md:block absolute inset-y-0 w-px bg-neutral-300 dark:bg-neutral-600"></div>
              <div className="block md:hidden absolute inset-x-0 h-px bg-neutral-300 dark:bg-neutral-600"></div>
              
              <Button
                onClick={handleTranslateButtonClick}
                className="menu-button !bg-neutral-400 dark:!bg-neutral-900 z-10 relative"
                title={`Translate to ${languages.find(l => l.code === targetLang)?.name}`}
                disabled={isLoading || !sourceText.trim()}
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
                      {languages.find(l => l.code === targetLang)?.name}
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
                          onClick={() => handleLanguageChange(lang.code)}
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
                placeholder="Translation will appear here..."
                className="w-full h-full p-2 pt-12 bg-transparent border-none resize-none focus:outline-none ios-scroll"
              />
              {translatedText && (
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
