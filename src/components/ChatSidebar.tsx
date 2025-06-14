import { Trash, Menu as MenuIcon } from "lucide-react";
import { Button } from "@headlessui/react";
import { getConfig } from "../config";
import { useMemo } from "react";
import { useChat } from "../hooks/useChat";
import { useSidebar } from "../contexts/SidebarContext";

export function ChatSidebar() {
  const config = getConfig();
  const { chats, chat, selectChat, deleteChat } = useChat();
  const { setShowSidebar } = useSidebar();
  
  // sort once per chats change
  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => new Date(b.updated || b.created || 0).getTime() - new Date(a.updated || a.created || 0).getTime()),
    [chats]
  );

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto sidebar-scroll bg-transparent">
      <div 
        className="flex items-center justify-between px-2 py-2 pt-safe-top pl-safe-left pr-safe-right flex-shrink-0 min-h-12"
      >
        <h2 className="text-xl font-semibold px-2 whitespace-nowrap overflow-hidden text-ellipsis text-neutral-800 dark:text-neutral-200">{config.title}</h2>
        <Button
          onClick={() => setShowSidebar(false)}
          className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/30 dark:hover:bg-black/20 rounded transition-all duration-200 cursor-pointer"
          aria-label="Close sidebar"
        >
          <MenuIcon size={20} />
        </Button>
      </div>
      
      <ul className="flex flex-col gap-2 py-2 px-2 pl-safe-left">
        {sortedChats.map((chatItem) => (
          <li
            key={chatItem.id}
            onClick={() => {
              selectChat(chatItem.id);
              // Close sidebar on mobile when chat is selected
              if (window.innerWidth < 768) {
                setShowSidebar(false);
              }
            }}
            className={`flex items-center justify-between sidebar-item cursor-pointer relative flex-shrink-0 ${
              chatItem.id === chat?.id ? "sidebar-item-selected" : ""
            }`}
          >
            <div
              className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-neutral-800 dark:text-neutral-200"
              title={chatItem.title ?? "Untitled"}
            >
              {chatItem.title ?? "Untitled"}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chatItem.id);
              }}
              className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer shrink-0 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <Trash size={16} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
