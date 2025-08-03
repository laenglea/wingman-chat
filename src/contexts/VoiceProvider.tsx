import { useState, useCallback, useEffect } from "react";
import { useVoiceWebSockets } from "../hooks/useVoiceWebSockets";
import { useChat } from "../hooks/useChat";
import { useProfile } from "../hooks/useProfile";
import { useBridge } from "../hooks/useBridge";
import { useRepository } from "../hooks/useRepository";
import { useRepositories } from "../hooks/useRepositories";
import { getConfig } from "../config";
import { Role } from "../types/chat";
import { VoiceContext, VoiceContextType } from './VoiceContext';

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const { addMessage, messages } = useChat();
  const { generateInstructions } = useProfile();
  const { bridgeTools, bridgeInstructions } = useBridge();
  const { currentRepository } = useRepositories();
  const { queryTools } = useRepository(currentRepository?.id || '');
  
  // Check voice availability from config
  useEffect(() => {
    try {
      const config = getConfig();
      setIsAvailable(config.voice);
    } catch (error) {
      console.warn('Failed to get voice config:', error);
      setIsAvailable(false);
    }
  }, []);
  
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

  const stopVoice = useCallback(async () => {
    await stop();
    setIsListening(false);
  }, [stop]);

  const startVoice = useCallback(async () => {
    try {
      // Build comprehensive instructions
      const profileInstructions = generateInstructions();
      const repositoryTools = currentRepository ? queryTools() : [];
      const repositoryInstructions = currentRepository?.instructions || '';
      
      const allTools = [...bridgeTools, ...repositoryTools];

      const instructions: string[] = [];

      if (profileInstructions?.trim()) {
        instructions.push(profileInstructions);
      }

      if (bridgeInstructions?.trim()) {
        instructions.push(bridgeInstructions);
      }
      
      if (repositoryInstructions.trim()) {
        instructions.push(repositoryInstructions);
      }

      if (repositoryTools.length > 0) {
        instructions.push(`Your mission:
1. For *every* user query, you MUST first invoke the \`query_knowledge_database\` tool with a concise, natural-language query.
2. Examine the tool's results.
   - If you get ≥1 relevant documents or facts, answer the user *solely* using those results.
   - Include source citations (e.g. doc IDs, relevance scores, or text snippets).
3. Only if the tool returns no relevant information, you may answer from general knowledge—but still note "no document match; using fallback knowledge".
4. If the tool call fails, report the failure and either retry or ask the user to clarify.
5. Be concise, accurate, and transparent about sources.

Use GitHub Flavored Markdown to format your responses including tables, code blocks, links, and lists.`);
      }

      const finalInstructions = instructions.length > 0 ? instructions.join('\n\n') : undefined;
      
      await start(undefined, undefined, finalInstructions, messages, allTools);
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
    }
  }, [start, generateInstructions, messages, bridgeTools, bridgeInstructions, queryTools, currentRepository]);

  const value: VoiceContextType = {
    isAvailable,
    isListening,
    startVoice,
    stopVoice,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}
