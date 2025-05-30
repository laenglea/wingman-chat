import { Trash } from "lucide-react";
import { Button } from "@headlessui/react";
import { Chat } from "../models/chat";
import { getConfig } from "../config";

type SidebarProps = {
  isVisible: boolean;

  chats: Chat[];
  selectedChat: Chat | null;

  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chat: Chat) => void;
};

export function Sidebar({
  isVisible,
  chats,
  selectedChat,
  onSelectChat,
  onDeleteChat,
}: SidebarProps) {
  const config = getConfig();
  
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = a.updated ? new Date(a.updated).getTime() : 0;
    const dateB = b.updated ? new Date(b.updated).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div
      className={`fixed h-full w-64 sidebar transition-transform duration-300 pl-safe-left ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ 
        top: 0, 
        left: 0, 
        height: '100vh'
      }}
    >
      <div 
        className="flex items-center px-2 py-2 pt-safe-top"
        style={{ 
          height: `calc(3rem + env(safe-area-inset-top, 0px))`
        }}
      >
        <h2 className="text-xl font-semibold px-2">{config.title}</h2>
      </div>
      
      <div 
        className="flex flex-col flex-1 overflow-hidden px-2"
        style={{ 
          paddingTop: '0'
        }}
      >
        <ul className="flex flex-col gap-2 flex-1 overflow-auto">
          {sortedChats.map((chat) => (
            <li
              key={chat.id}
              className={`flex items-center justify-between sidebar-item ${
                chat.id === selectedChat?.id ? "sidebar-item-selected" : ""
              }`}
            >
              <div
                onClick={() => onSelectChat(chat)}
                className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                title={chat.title ?? "Untitled"}
              >
                {chat.title ?? "Untitled"}
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat);
                }}
                className="cursor-pointer"
              >
                <Trash size={16} />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
