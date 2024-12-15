import { Message } from "../models/chat";

const STORAGE_KEY = 'chat_sessions';

function getChats(): Record<string, Message[]> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return {};
  
  try {
    return JSON.parse(stored) as Record<string, Message[]>;
  } catch (e) {
    console.error("Failed to parse chat sessions:", e);
    return {};
  }
}

function storeChats(chats: Record<string, Message[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function getMessagesForChat(chatId: string): Message[] {
  const chats = getChats();
  return chats[chatId] || [];
}

export function storeMessagesForChat(chatId: string, messages: Message[]) {
  const chats = getChats();
  chats[chatId] = messages;
  
  storeChats(chats);
}

export function listChatIds(): string[] {
  const chats = getChats();
  return Object.keys(chats);
}

export function createNewChat(): string {
  const chats = getChats();
  const newId = `chat_${Date.now()}`;
  chats[newId] = [];
  storeChats(chats);
  return newId;
}

export function removeChat(chatId: string): void {
  const chats = getChats();
  if (chats[chatId]) {
    delete chats[chatId];
    storeChats(chats);
  }
}