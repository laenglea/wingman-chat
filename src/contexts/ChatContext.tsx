import { createContext, useState, useCallback, useRef, useEffect } from "react";
import { Chat, Message, Model, Role } from "../models/chat";
import { useModels } from "../hooks/useModels";
import { useChats } from "../hooks/useChats";
import { getConfig } from "../config";

export interface ChatContextType {
  // Models
  models: Model[];
  model: Model | null; // Current effective model (derived from chat.model || selectedModel || models[0])
  setModel: (model: Model | null) => void;

  // Chats
  chats: Chat[];
  chat: Chat | null;
  messages: Message[];

  // Chat actions
  createChat: () => Chat;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  sendMessage: (message: Message) => Promise<void>;

  // Refs for stable references
  chatsRef: React.MutableRefObject<Chat[]>;
  chatIdRef: React.MutableRefObject<string | null>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const config = getConfig();
  const client = config.client;
  const bridge = config.bridge;

  const { models, selectedModel, setSelectedModel } = useModels();
  const { chats, createChat: createChatHook, updateChat, deleteChat: deleteChatHook } = useChats();
  const [chatId, setChatId] = useState<string | null>(null);

  const chat = chats.find(c => c.id === chatId) ?? null;
  const model = chat?.model ?? selectedModel ?? models[0];
  const messages = chat?.messages ?? [];

  // Use refs to maintain stable references for frequently changing values
  const chatsRef = useRef(chats);
  const chatIdRef = useRef(chatId);
  
  // Update refs when values change
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Handler functions with stable references
  const createChat = useCallback(() => {
    const newChat = createChatHook();
    setChatId(newChat.id);
    return newChat;
  }, [createChatHook]);

  const selectChat = useCallback((chatId: string) => {
    setChatId(chatId);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    deleteChatHook(chatId);
    if (chatsRef.current.find(c => c.id === chatIdRef.current)?.id === chatId) {
      setChatId(null);
    }
  }, [deleteChatHook]);

  // Unified setModel function that does the right thing based on context
  const setModel = useCallback((model: Model | null) => {
    if (chat) {
      // Update existing chat's model
      updateChat(chat.id, { model });
    } else {
      // Store selected model for when a new chat is created
      setSelectedModel(model);
    }
  }, [chat, updateChat, setSelectedModel]);

  const sendMessage = useCallback(async (message: Message) => {
    let currentChat = chat;

    if (!model) throw new Error("no model selected");

    if (!currentChat) {
      currentChat = createChatHook();
      currentChat.model = model;
      setChatId(currentChat.id);
      // Update the chat with the model
      updateChat(currentChat.id, { model });
    }

    const base = [...currentChat.messages, message];
    const updateMessages = (msgs: typeof base) => updateChat(currentChat.id, { messages: msgs });
    updateMessages([...base, { role: Role.Assistant, content: "" }]);

    try {
      const tools = await bridge.listTools();

      const completion = await client.complete(
        model.id,
        tools,
        base,
        (_, snapshot) => updateMessages([...base, { role: Role.Assistant, content: snapshot }])
      );

      updateMessages([...base, completion]);

      if (!currentChat.title || base.length % 3 === 0) {
        client
          .summarize(model.id, base)
          .then((title) => updateChat(currentChat.id, { title }));
      }
    } catch (error) {
      console.error(error);

      if (error?.toString().includes("missing finish_reason")) return;

      const errorMessage = {
        role: Role.Assistant,
        content: `An error occurred:\n${error}`,
      };
      updateMessages([...base, errorMessage]);
    }
  }, [chat, model, createChatHook, updateChat, bridge, client]);

  const value: ChatContextType = {
    // Models
    models,
    model,
    setModel,

    // Chats
    chats,
    chat,
    messages,

    // Chat actions
    createChat,
    selectChat,
    deleteChat,
    updateChat,
    sendMessage,

    // Refs
    chatsRef,
    chatIdRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
