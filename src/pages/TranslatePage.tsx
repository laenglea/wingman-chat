import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { PilcrowRightIcon, Loader2, PlusIcon, GlobeIcon } from "lucide-react";
import { getConfig } from "../config";

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

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const performTranslate = async (langToUse: string, textToTranslate: string) => {
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
  };

  const handleTranslateButtonClick = () => {
    performTranslate(targetLang, sourceText);
  };

  const handleLanguageChange = (newLangCode: string) => {
    setTargetLang(newLangCode);

    (async () => {
      await performTranslate(newLangCode, sourceText);
    })();
  };

  const handleReset = () => {
    setSourceText("");
    setTranslatedText("");
  };

  // Simple portal approach - only render portals after component is mounted
  const leftControlsContainer = mounted ? document.getElementById('translate-left-controls') : null;
  const rightControlsContainer = mounted ? document.getElementById('translate-right-controls') : null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {leftControlsContainer && createPortal(
        <div className="flex items-center gap-2">
          <Menu>
            <MenuButton className="inline-flex items-center menu-button">
              <GlobeIcon size={16} className="mr-1" />
              <span>{languages.find(l => l.code === targetLang)?.name}</span>
            </MenuButton>
            <MenuItems
              transition
              anchor="bottom start"
              className="!max-h-[50vh] mt-2 w-48 rounded border bg-neutral-200 dark:bg-neutral-900 border-neutral-700 overflow-y-auto shadow-lg"
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
        </div>,
        leftControlsContainer
      )}

      {rightControlsContainer && createPortal(
        <Button
          className="menu-button"
          onClick={handleReset}
          title="Clear translation"
        >
          <PlusIcon size={20} />
        </Button>,
        rightControlsContainer
      )}

      <main className="flex-1 flex flex-col pb-4 overflow-hidden">
        <div className="w-full flex flex-col md:flex-row items-stretch gap-4 flex-grow p-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-2 relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full flex-grow p-4 border rounded shadow-sm resize-none bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 ios-scroll"
            />
          </div>

          <div className="flex flex-col items-center justify-center px-2">
            <button
              onClick={handleTranslateButtonClick}
              className="px-3 py-2 font-semibold rounded menu-button transition-colors focus:outline-none disabled:opacity-50"
              title={`Translate to ${languages.find(l => l.code === targetLang)?.name}`}
              disabled={isLoading || !sourceText.trim()}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PilcrowRightIcon />
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-2 relative">
            <textarea
              value={translatedText}
              readOnly
              placeholder={"Translation will appear here..."}
              className="w-full flex-grow p-4 border rounded shadow-sm resize-none bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 ios-scroll"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default TranslatePage;
