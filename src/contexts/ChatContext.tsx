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
  createChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  
  addMessage: (message: Message) => void;
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
    setChatId(null);
  }, []);

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

  // Helper function to get or create the current chat
  const ensureCurrentChat = useCallback(() => {
    if (!model) throw new Error("no model selected");

    let currentChat = chat;
    let currentChatId = chatIdRef.current;

    // If we don't have a current chat, create one
    if (!currentChat && !currentChatId) {
      currentChat = createChatHook();
      currentChat.model = model;
      setChatId(currentChat.id);
      updateChat(currentChat.id, { model });
      currentChatId = currentChat.id;
    } else if (!currentChat && currentChatId) {
      // We have a chatId but no chat object, find it in chats
      currentChat = chatsRef.current.find(c => c.id === currentChatId) || null;
    }

    // If we still don't have a chat, something is wrong
    if (!currentChat || !currentChatId) {
      throw new Error('Could not determine current chat');
    }

    return { chat: currentChat, chatId: currentChatId };
  }, [chat, model, createChatHook, updateChat, setChatId, chatsRef, chatIdRef]);

  const addMessage = useCallback((message: Message) => {
    if (!message.content.trim()) return;
    
    const { chatId } = ensureCurrentChat();
    
    // Get the absolute latest chat state to avoid race conditions
    const latestChat = chatsRef.current.find(c => c.id === chatId);
    const currentMessages = latestChat?.messages || [];
    const updatedMessages = [...currentMessages, message];
    
    updateChat(chatId, { messages: updatedMessages });
  }, [ensureCurrentChat, updateChat, chatsRef]);

  const sendMessage = useCallback(async (message: Message) => {
    const { chat: currentChat, chatId } = ensureCurrentChat();

    // Get current messages and add the user message
    const latestChat = chatsRef.current.find(c => c.id === chatId);
    const currentMessages = latestChat?.messages || [];
    const base = [...currentMessages, message];
    
    const updateMessages = (msgs: Message[]) => updateChat(chatId, { messages: msgs });
    
    // Add user message and empty assistant message for streaming
    updateMessages([...base, { role: Role.Assistant, content: "" }]);

    try {
      const tools = await bridge.listTools();

      const completion = await client.complete(
        model!.id,
        tools,
        base,
        (_, snapshot) => updateMessages([...base, { role: Role.Assistant, content: snapshot }])
      );

      updateMessages([...base, completion]);

      if (!currentChat.title || base.length % 3 === 0) {
        client
          .summarize(model!.id, base)
          .then((title) => updateChat(chatId, { title }));
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
  }, [ensureCurrentChat, updateChat, bridge, client, model, chatsRef]);

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
    
    addMessage,
    sendMessage,

    // Refs
    chatsRef,
    chatIdRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
