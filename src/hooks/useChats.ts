import { useState } from 'react';

import { Chat } from '../models/chat';
import { model } from '../lib/client';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);

  const createChat = () => {
    const chat = {
      id: crypto.randomUUID(),
      title: "Untitled",

      model: model,
      messages: [],
    };

    setChats((prev) => [...prev, chat]);
    return chat;
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  return { chats, createChat, deleteChat };
}