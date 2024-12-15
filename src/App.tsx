import { useState, useEffect, useRef } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { Chat, Message, Model, Role } from './models/chat';
import { useChats } from './hooks/useChats';
import { complete, models } from './lib/client';
import { title } from './lib/config';
import { ChatModel } from './components/ChatModel';

function App() {
  const { chats, createChat, deleteChat } = useChats()

  const [showSidebar, setShowSidebar] = useState(false);

  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [currentModel, setCurrentModel] = useState<Model>(models[0]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  
  const messageContainerRef = useRef<HTMLDivElement>(null);

  function toggleSidebar() {
    setShowSidebar(!showSidebar);
  }

  function handleCreateChat(): void {
    setCurrentChat(null);
  }

  function handleDeleteChat(id: string): void {
    deleteChat(id)
    
    if (currentChat?.id === id) {
      handleCreateChat();
    }
  }

  function handleSelectChat(chat: Chat) {
    setCurrentChat(chat);
  }

  function handleSelectModel(model: Model) {
    setCurrentModel(model);
  }

  const sendMessage = async (message: Message) => {    
    var chat = currentChat;
    var model = currentModel;
    
    if (!chat) {
      chat = createChat();
      chat.model = model;

      setCurrentChat(chat);
    }

    var messages = [...currentMessages, message];

    setCurrentMessages([...messages, {
      role: Role.Assistant,
      content: "...",
    }]);
    
    const completion = await complete(model.id, messages, (delta, snapshot) => {
      setCurrentMessages([...messages, {
        role: Role.Assistant,
        content: snapshot,
      }]);
    });

    setCurrentMessages([...messages, completion]);
  };

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    if (chats.length == 0) {
      setShowSidebar(false);
    }
  }, [chats])

  useEffect(() => {
    if (currentChat) {
      currentChat.model = currentModel;
    }
  }, [currentModel])

  useEffect(() => {
    if (currentChat) {
      currentChat.messages = currentMessages;
    }    
  }, [currentMessages])

  useEffect(() => {
    setCurrentModel(currentChat?.model ?? currentModel);
    setCurrentMessages(currentChat?.messages ?? []);
  }, [currentChat])

  useEffect(() => {    
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [currentChat, currentMessages]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#121212]">
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-[#1c1c1e] text-[#e5e5e5] transition-all duration-300 overflow-hidden`}>
        <Sidebar
          isVisible={showSidebar}
          chats={chats}
          selectedChat={currentChat}          
          onSelectChat={handleSelectChat}
          onDeleteChat={(chat) => handleDeleteChat(chat.id)}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-2 flex items-center justify-between bg-[#121212] flex-shrink-0">
          <button
            className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-[#1c1c1e] rounded"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </button>

          <ChatModel
            models={models}
            selectedModel={currentModel}
            onSelectModel={(model) => handleSelectModel(model)}
          />

          <button
            className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-[#1c1c1e] rounded"
            onClick={handleCreateChat}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#121212] p-4" ref={messageContainerRef}>
          <ChatWindow messages={currentMessages} />
        </div>

        <div className="bg-[#121212] border-t border-[#3a3a3c] p-4">
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}

export default App;