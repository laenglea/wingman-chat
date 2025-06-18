import { useEffect, useMemo, useRef, useState } from "react";
import { Plus as PlusIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@headlessui/react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSidebar } from "../contexts/SidebarContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useResponsive } from "../hooks/useResponsive";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "../components/ChatInput";
import { ChatMessage } from "../components/ChatMessage";
import { ChatSidebar } from "../components/ChatSidebar";
import { useBackground } from "../hooks/useBackground";

export function ChatPage() {
  const {
    chat,
    messages,
    createChat
  } = useChat();
  
  const { isResponsive, toggleResponsive } = useResponsive();
  
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
  const sidebarContent = useMemo(() => (
    <ChatSidebar />
  ), []);

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

  // Background styles and className from useBackground hook
  const { backgroundStyles, backgroundClassName } = useBackground();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {/* Background image - only show when no messages, logic handled here */}
      {messages.length === 0 && (
        <div className={backgroundClassName} style={backgroundStyles} />
      )}
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toggle button - positioned within content area */}
        <div className="hidden md:block absolute top-18 right-4 z-20">
          <Button
            onClick={toggleResponsive}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded transition-all duration-150 ease-out cursor-pointer"
            title={isResponsive ? "Switch to fixed width (900px)" : "Switch to responsive mode (80%/80%)"}
          >
            {isResponsive ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        </div>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center pt-16 relative">
            <div className="flex flex-col items-center text-center relative z-10 w-full max-w-4xl px-4">
              {/* Content will be centered here when needed */}
            </div>
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto ios-scroll sidebar-scroll"
            ref={containerRef}
            onScroll={handleScroll}
          >
            <div className={`px-2 pt-20 pb-28 ${
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

      <footer className={`absolute left-0 right-0 bg-transparent md:pb-4 pb-safe-bottom px-3 pl-safe-left pr-safe-right pointer-events-none transition-all duration-600 ease-out ${
        messages.length === 0 ? 'bottom-1/2 transform translate-y-1/2' : 'bottom-0'
      } ${isAnimating ? 'transition-all duration-600 ease-out' : ''}`}>
        <div className={`relative pointer-events-auto ${
          isResponsive ? 'max-w-full md:max-w-[80vw] mx-auto' : 'max-content-width'
        } ${messages.length === 0 ? 'max-w-4xl' : ''}`}>
          <ChatInput />
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;