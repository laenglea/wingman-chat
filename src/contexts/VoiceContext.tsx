import { createContext, useState, useCallback } from "react";
import { useVoiceWebSockets } from "../hooks/useVoiceWebSockets";
import { useChat } from "../hooks/useChat";
import { Role } from "../models/chat";

export interface VoiceContextType {
  isVoiceMode: boolean;
  isListening: boolean;
  isConnecting: boolean;
  toggleVoiceMode: () => void;
  stopVoiceMode: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export { VoiceContext };

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { addMessage } = useChat();
  
  const onUserTranscript = useCallback((text: string) => {
    let content = text;
    
    // Handle case where text might be a JSON string or object
    try {
      // First, check if it's already a string that looks like JSON
      if (typeof text === 'string' && text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed.text) {
          content = parsed.text;
        } else if (typeof parsed === 'string') {
          content = parsed;
        }
      }
    } catch {
      // If parsing fails, use the original text
      content = text;
    }
    
    // Additional check: if content is still an object, try to extract text
    if (typeof content === 'object' && content !== null && 'text' in content) {
      content = (content as { text: string }).text;
    }
    
    console.log('User transcript:', { original: text, processed: content });
    
    if (content.trim()) {
      addMessage({ role: Role.User, content });
    }
  }, [addMessage]);

  const onAssistantTranscript = useCallback((text: string) => {
    let content = text;
    
    // Handle case where text might be a JSON string or object
    try {
      // First, check if it's already a string that looks like JSON
      if (typeof text === 'string' && text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed.text) {
          content = parsed.text;
        } else if (typeof parsed === 'string') {
          content = parsed;
        }
      }
    } catch {
      // If parsing fails, use the original text
      content = text;
    }
    
    // Additional check: if content is still an object, try to extract text
    if (typeof content === 'object' && content !== null && 'text' in content) {
      content = (content as { text: string }).text;
    }
    
    console.log('Assistant transcript:', { original: text, processed: content });
    
    if (content.trim()) {
      addMessage({ role: Role.Assistant, content });
    }
  }, [addMessage]);

  const { start, stop } = useVoiceWebSockets(onUserTranscript, onAssistantTranscript);

  const stopVoiceMode = useCallback(() => {
    stop();
    setIsVoiceMode(false);
    setIsListening(false);
    setIsConnecting(false);
  }, [stop]);

  const toggleVoiceMode = useCallback(async () => {
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      try {
        setIsConnecting(true);
        await start();
        setIsVoiceMode(true);
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start voice mode:', error);
        // Show user-friendly error if API key is missing
        const errorMessage = error?.toString() || '';
        if (errorMessage.includes('API key') || errorMessage.includes('401')) {
          alert('Voice mode requires an OpenAI API key to be configured. Please add your API key to the configuration.');
        } else {
          alert('Failed to start voice mode. Please check your microphone permissions and try again.');
        }
      } finally {
        setIsConnecting(false);
      }
    }
  }, [isVoiceMode, start, stopVoiceMode]);

  const value: VoiceContextType = {
    isVoiceMode,
    isListening,
    isConnecting,
    toggleVoiceMode,
    stopVoiceMode,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}
