import { useState } from 'react';

import { Chat } from '../models/chat';

const STORAGE_KEY = 'app_chats';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(() => loadLocalChats());

  function createChat() {
    const chat = {
      id: crypto.randomUUID(),
      title: "Untitled",

      created: new Date(),
      updated: new Date(),

      model: null,
      messages: [],
    };

    setChats((prev) => {
      const items = [...prev, chat];
      saveLocalChats(items);

      return items;
    });
    
    return chat;
  };

  function deleteChat(chatId: string) {
    setChats((prev) => {
      const items = prev.filter((chat) => chat.id !== chatId);
      saveLocalChats(items);
      
      return items;
    });
  };

  function saveChats() {
    saveLocalChats(chats)
  }

  function saveLocalChats(chats: Chat[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      console.log('chats saved');
    }
    catch (error) {
      console.error('error saving chats', error);
    }
  }

  function loadLocalChats() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        return [];
      }

      const charts = JSON.parse(data);

      if (!Array.isArray(charts)) {
        return [];
      }

      console.log('chats loaded');
      return charts;
    }
    catch (error) {
      console.error('error loading charts', error);
      return [];
    }
  }

  return { chats, createChat, deleteChat, saveChats };
}