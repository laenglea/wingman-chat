import { Trash } from "lucide-react";
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
      className={`fixed top-0 left-0 h-full w-64 sidebar transition-transform duration-300 ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full gap-4 p-4">
        <h2 className="text-xl font-semibold">{config.title}</h2>
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
                className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                title={chat.title ?? "Untitled"}
              >
                {chat.title ?? "Untitled"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat);
                }}
                className="cursor-pointer"
              >
                <Trash size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
