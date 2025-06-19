import { useEffect, useMemo, useRef, useState } from "react";
import { Plus as PlusIcon } from "lucide-react";
import { Button } from "@headlessui/react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSidebar } from "../contexts/SidebarContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useLayout } from "../hooks/useLayout";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "../components/ChatInput";
import { ChatMessage } from "../components/ChatMessage";
import { ChatSidebar } from "../components/ChatSidebar";

export function ChatPage() {
  const {
    chat,
    messages,
    createChat,
    chats
  } = useChat();
  
  const { layoutMode } = useLayout();
  
  // Sidebar integration (now only controls visibility)
  const { setSidebarContent } = useSidebar();
  const { setRightActions } = useNavigation();

  const { containerRef, bottomRef, handleScroll, enableAutoScroll } = useAutoScroll({
    dependencies: [chat, messages],
  });

  // Animation state for chat input
  const [isAnimating, setIsAnimating] = useState(false);
  const prevMessagesCountRef = useRef(0);

  // Set up navigation actions (only once on mount)
  useEffect(() => {
    setRightActions(
      <Button
        className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded transition-all duration-150 ease-out cursor-pointer"
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
  const sidebarContent = useMemo(() => {
    // Only show sidebar if there are chats
    if (chats.length === 0) {
      return null;
    }
    return <ChatSidebar />;
  }, [chats.length]);

  // Set up sidebar content when it changes
  useEffect(() => {
    setSidebarContent(sidebarContent);
    return () => setSidebarContent(null);
  }, [sidebarContent, setSidebarContent]);

  // Force scroll to bottom only for new user messages, not streaming updates
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    // Only force scroll if a completely new message was added (not just updated)
    if (messages.length > prevMessagesLengthRef.current) {
      // This indicates a new message was added (user or assistant), not just streaming content
      enableAutoScroll();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, enableAutoScroll]);

  // Handle animation when first message is added
  useEffect(() => {
    if (prevMessagesCountRef.current === 0 && messages.length > 0) {
      setIsAnimating(true);
      // Reset animation state after animation completes
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Match the CSS transition duration
      
      return () => {
        clearTimeout(animationTimer);
      };
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center pt-16 relative">
            <div className="flex flex-col items-center text-center relative z-10 w-full max-w-4xl px-4 mb-32">
              {/* Logo */}
              <div className="mb-8">
                <img 
                  src="/logo.svg" 
                  alt="Wingman Chat" 
                  className="h-24 w-24 opacity-80 dark:opacity-60"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto ios-scroll sidebar-scroll"
            ref={containerRef}
            onScroll={handleScroll}
          >
            <div className={`px-2 pt-20 pb-28 ${
              layoutMode === 'wide'
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

      <footer className={`absolute left-0 right-0 bg-transparent md:pb-4 pb-safe-bottom px-3 pl-safe-left pr-safe-right pointer-events-none transition-all duration-600 ease-out z-20 ${
        messages.length === 0 ? 'bottom-1/3 transform translate-y-1/2' : 'bottom-0'
      } ${isAnimating ? 'transition-all duration-600 ease-out' : ''}`}>
        <div className={`relative pointer-events-auto ${
          layoutMode === 'wide' ? 'max-w-full md:max-w-[80vw] mx-auto' : 'max-content-width'
        } ${messages.length === 0 ? 'max-w-4xl' : ''}`}>
          <ChatInput />
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;