import { useState, useEffect, useRef } from "react";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import { Chat, Message, Model, Role } from "./models/chat";
import { useChats } from "./hooks/useChats";
import { useModels } from "./hooks/useModels";
import { complete } from "./lib/client";
import { ChatModel } from "./components/ChatModel";

function App() {
  const { chats, createChat, deleteChat, saveChats } = useChats();
  const { models } = useModels();

  const [showSidebar, setShowSidebar] = useState(false);

  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [currentModel, setCurrentModel] = useState<Model>();
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleCreateChat = () => {
    setCurrentChat(null);
  };

  const handleDeleteChat = (id: string) => {
    deleteChat(id);

    if (currentChat?.id === id) {
      handleCreateChat();
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const handleSelectModel = (model: Model) => {
    setCurrentModel(model);
  };

  const sendMessage = async (message: Message) => {
    var chat = currentChat;
    var model = currentModel;

    if (!model) {
      throw new Error("no model selected");
    }

    if (!chat) {
      chat = createChat();
      chat.model = model;

      setCurrentChat(chat);
    }

    var messages = [...currentMessages, message];

    setCurrentMessages([
      ...messages,
      {
        role: Role.Assistant,
        content: "...",
      },
    ]);

    try {
      const completion = await complete(model.id, messages, (_, snapshot) => {
        setCurrentMessages([
          ...messages,
          {
            role: Role.Assistant,
            content: snapshot,
          },
        ]);
      });

      setCurrentMessages([...messages, completion]);
    } catch (error) {
      var content =
        "An error occurred while processing the request.\n" + error?.toString();

      setCurrentMessages([
        ...messages,
        {
          role: Role.Assistant,
          content: content,
        },
      ]);
    }
  };

  useEffect(() => {
    if (currentModel) {
      return;
    }

    if (models.length > 0) {
      setCurrentModel(models[0]);
    }
  }, [models]);

  useEffect(() => {
    if (chats.length == 0) {
      setShowSidebar(false);
    }
  }, [chats]);

  useEffect(() => {
    if (currentChat) {
      currentChat.updated = new Date();
      currentChat.model = currentModel ?? null;
    }
  }, [currentModel]);

  useEffect(() => {
    if (currentChat) {
      currentChat.updated = new Date();
      currentChat.messages = currentMessages;
      saveChats();
    }
  }, [currentMessages]);

  useEffect(() => {
    setCurrentModel(currentChat?.model ?? currentModel);
    setCurrentMessages(currentChat?.messages ?? []);
  }, [currentChat]);

  useEffect(() => {
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [currentChat, currentMessages]);

  return (
    <div className="h-dvh w-dvw overflow-hidden flex bg-[#121212]">
      {/* Sidebar */}
      <aside
        className={`${
          showSidebar ? "w-64" : "w-0"
        } bg-[#1c1c1e] text-[#e5e5e5] transition-all duration-300 overflow-hidden`}
      >
        <Sidebar
          isVisible={showSidebar}
          chats={chats}
          selectedChat={currentChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={(chat) => handleDeleteChat(chat.id)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-2 flex items-center justify-between bg-[#121212] flex-shrink-0">
          <div className="flex gap-2">
            <button
              className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-[#1c1c1e] rounded"
              onClick={toggleSidebar}
            >
              <Menu size={20} />
            </button>

            <ChatModel
              models={models}
              selectedModel={currentModel ?? null}
              onSelectModel={handleSelectModel}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-[#1c1c1e] rounded"
              onClick={handleCreateChat}
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Chat Window */}
        <div
          className="flex-1 overflow-auto bg-[#121212] p-4"
          ref={messageContainerRef}
        >
          <ChatWindow messages={currentMessages} />
        </div>

        {/* Input Area */}
        <footer className="bg-[#121212] border-t border-[#3a3a3c] p-4">
          <ChatInput onSend={sendMessage} />
        </footer>
      </main>
    </div>
  );
}

export default App;
