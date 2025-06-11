import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Plus as PlusIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@headlessui/react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useSidebar } from "../contexts/SidebarContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useResponsiveness } from "../hooks/useResponsiveness";
import { useChat } from "../hooks/useChat";
import { useVoiceWebSockets } from "../hooks/useVoiceWebSockets";
import { ChatInput } from "../components/ChatInput";
import { ChatMessage } from "../components/ChatMessage";
import { ChatSidebar } from "../components/ChatSidebar";
import { VoiceButton } from "../components/VoiceButton";

export function ChatPage() {
  const {
    chat,
    messages,
    createChat,
    addMessage
  } = useChat();
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { isResponsive, toggleResponsiveness } = useResponsiveness();
  
  const stopVoiceRef = useRef<(() => void) | null>(null);
  
  // Voice input functionality
  const { start: startVoice, stop: stopVoice } = useVoiceWebSockets(
    // onUser callback - create user message
    (transcript) => {
      console.log('User transcript received:', transcript);
      if (transcript.trim()) {
        const userMessage = {
          role: 'user' as const,
          content: transcript.trim(),
        };
        console.log('Adding user message:', userMessage);
        addMessage(userMessage);
      }
    },
    // onAssistant callback - create assistant message
    (transcript) => {
      console.log('Assistant transcript received:', transcript);
      if (transcript.trim()) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: transcript.trim(),
        };
        console.log('Adding assistant message:', assistantMessage);
        addMessage(assistantMessage);
      }
    }
  );

  // Update the ref when stopVoice changes
  useEffect(() => {
    stopVoiceRef.current = stopVoice;
  }, [stopVoice]);

  const handleVoiceToggle = useCallback(async () => {
    try {
      if (isVoiceActive) {
        // Stop voice session
        setIsVoiceActive(false);
        await stopVoice();
      } else {
        // Start voice session
        setIsVoiceActive(true);
        await startVoice();
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      setIsVoiceActive(false);
    }
  }, [isVoiceActive, stopVoice, startVoice]);
  
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

  // Cleanup voice session on unmount
  useEffect(() => {
    return () => {
      if (isVoiceActive && stopVoiceRef.current) {
        stopVoiceRef.current();
      }
    };
  }, [isVoiceActive]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {/* Toggle buttons - positioned at page level */}
      <div className="hidden md:block absolute top-4 right-4 z-20">
        <div className="flex items-center gap-2">
          <VoiceButton
            isActive={isVoiceActive}
            onToggle={handleVoiceToggle}
          />
          <Button
            onClick={toggleResponsiveness}
            className="menu-button !p-1.5"
            title={isResponsive ? "Switch to fixed width (900px)" : "Switch to responsive mode (80%/80%)"}
          >
            {isResponsive ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        </div>
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
        {!isVoiceActive && (
          <div className={isResponsive ? 'max-w-full md:max-w-[80vw] mx-auto' : 'max-content-width'}>
            <ChatInput />
          </div>
        )}
        {isVoiceActive && (
          <div className={`${isResponsive ? 'max-w-full md:max-w-[80vw] mx-auto' : 'max-content-width'} py-4`}>
            <div className="flex items-center justify-center text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Voice chat active - Speak to continue conversation</span>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default ChatPage;