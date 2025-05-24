import { useState } from "react";
import { ChatPage } from "./pages/ChatPage";
import { TranslatePage } from "./pages/TranslatePage";

type Page = "chat" | "translate";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");

  const pages: { key: Page; label: string }[] = [
    { key: "chat", label: "Chat" },
    { key: "translate", label: "Translate" },
  ];

  return (
    <div className="h-dvh w-dvw flex flex-col overflow-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 p-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 w-1/3">
            {currentPage === "chat" && <div id="chat-left-controls"></div>}
            {currentPage === "translate" && <div id="translate-left-controls"></div>}
          </div>
          
          <div className="flex space-x-2">
            {pages.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentPage(key)}
                className={`px-4 p-2 font-medium rounded transition-colors ${
                  currentPage === key
                    ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200"
                    : "bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 w-1/3 justify-end">
            {currentPage === "chat" && <div id="chat-right-controls"></div>}
            {currentPage === "translate" && <div id="translate-right-controls"></div>}
          </div>
        </div>
      </nav>
      <div className="flex-grow pt-16 overflow-hidden">
        {currentPage === "chat" && <ChatPage />}
        {currentPage === "translate" && <TranslatePage />}
      </div>
    </div>
  );
}

export default App;
