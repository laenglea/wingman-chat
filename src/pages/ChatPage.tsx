import { useEffect, useMemo } from "react";
import { Plus as PlusIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@headlessui/react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSidebar } from "../contexts/SidebarContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useResponsiveness } from "../hooks/useResponsiveness";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "../components/ChatInput";
import { ChatMessage } from "../components/ChatMessage";
import { ChatSidebar } from "../components/ChatSidebar";

export function ChatPage() {
  const {
    chat,
    messages,
    createChat
  } = useChat();
  
  const { isResponsive, toggleResponsiveness } = useResponsiveness();
  
  // Sidebar integration (now only controls visibility)
  const { setSidebarContent } = useSidebar();
  const { setRightActions } = useNavigation();

  const { containerRef, bottomRef, handleScroll } = useAutoScroll({
    dependencies: [chat, messages],
  });

  // Set up navigation actions (only once on mount)
  useEffect(() => {
    setRightActions(
      <Button
        className="menu-button"
        onClick={createChat}
      >
        <PlusIcon size={20} />
      </Button>
    );

    // Cleanup when component unmounts
    return () => {
      setRightActions(null);
    };
  }, [setRightActions, createChat]);

  // Create sidebar content with useMemo to avoid infinite re-renders
  const sidebarContent = useMemo(() => (
    <ChatSidebar />
  ), []);

  // Set up sidebar content when it changes
  useEffect(() => {
    setSidebarContent(sidebarContent);
    return () => setSidebarContent(null);
  }, [sidebarContent, setSidebarContent]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {/* Toggle button - positioned at page level */}
      <div className="hidden md:block absolute top-4 right-4 z-20">
        <Button
          onClick={toggleResponsiveness}
          className="menu-button !p-1.5"
          title={isResponsive ? "Switch to fixed width (900px)" : "Switch to responsive mode (80%/80%)"}
        >
          {isResponsive ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <img src="/logo.svg" className="w-32 h-32 dark:opacity-80" alt="Wingman Chat" />
            </div>
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto ios-scroll sidebar-scroll"
            ref={containerRef}
            onScroll={handleScroll}
          >
            <div className={`px-2 pt-4 ${
              isResponsive 
                ? 'max-w-full md:max-w-[80vw] mx-auto' 
                : 'max-content-width'
            }`}>
              {messages.map((message, idx) => (
                <ChatMessage key={idx} message={message} />
              ))}
              
              {/* sentinel for scrollIntoView */}
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-neutral-50 dark:bg-neutral-950 md:pb-4 pb-safe-bottom px-3 pl-safe-left pr-safe-right">
        <div className={isResponsive ? 'max-w-full md:max-w-[80vw] mx-auto' : 'max-content-width'}>
          <ChatInput />
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;