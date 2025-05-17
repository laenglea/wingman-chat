import { useState, useRef, useCallback } from 'react';

import { Chat } from '../models/chat';

const STORAGE_KEY = 'app_chats';
const SAVE_DELAY = 2000;

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(() => loadLocalChats());
  const saveTimeoutRef = useRef<number | null>(null);

  function createChat() {
    const chat = {
      id: crypto.randomUUID(),

      created: new Date(),
      updated: new Date(),

      model: null,
      messages: [],
    };

    setChats((prev) => {
      const items = [...prev, chat];
      debounceSaveChats(items);

      return items;
    });
    
    return chat;
  };

  function deleteChat(chatId: string) {
    setChats((prev) => {
      const items = prev.filter((chat) => chat.id !== chatId);
      debounceSaveChats(items);
      
      return items;
    });
  };

  const debounceSaveChats = useCallback((chatItems = chats) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      const savedChats = loadLocalChats();

      if (JSON.stringify(chatItems) !== JSON.stringify(savedChats)) {
        saveLocalChats(chatItems);
      }
      
      saveTimeoutRef.current = null;
    }, SAVE_DELAY);
  }, [chats]);

  function saveChats() {
    debounceSaveChats();
  }

  function saveLocalChats(chats: Chat[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      //console.log('chats saved');
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

      //console.log('chats loaded');
      return charts;
    }
    catch (error) {
      console.error('error loading charts', error);
      return [];
    }
  }

  return { chats, createChat, deleteChat, saveChats };
}