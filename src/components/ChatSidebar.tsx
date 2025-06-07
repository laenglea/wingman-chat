import { Trash } from "lucide-react";
import { Button } from "@headlessui/react";
import { Chat } from "../models/chat";
import { getConfig } from "../config";
import { useMemo } from "react";

type ChatSidebarProps = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
};

export function ChatSidebar({ chats, selectedChatId, onSelectChat, onDeleteChat }: ChatSidebarProps) {
  const config = getConfig();
  // sort once per chats change
  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => new Date(b.updated || b.created || 0).getTime() - new Date(a.updated || a.created || 0).getTime()),
    [chats]
  );

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto sidebar-scroll bg-white dark:bg-neutral-900">
      <div 
        className="flex items-center px-2 py-2 pt-safe-top pl-safe-left flex-shrink-0"
        style={{ height: `calc(3rem + env(safe-area-inset-top, 0px))` }}
      >
        <h2 className="text-xl font-semibold px-2 whitespace-nowrap overflow-hidden text-ellipsis">{config.title}</h2>
      </div>
      
      <ul className="flex flex-col gap-2 py-2 px-2 pl-safe-left">
        {sortedChats.map((chat) => (
          <li
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center justify-between sidebar-item cursor-pointer relative flex-shrink-0 ${
              chat.id === selectedChatId ? "sidebar-item-selected" : ""
            }`}
          >
            <div
              className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-2"
              title={chat.title ?? "Untitled"}
            >
              {chat.title ?? "Untitled"}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer shrink-0"
            >
              <Trash size={16} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
