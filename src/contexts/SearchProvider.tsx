import { useState, ReactNode, useCallback, useEffect } from "react";
import { SearchContext, SearchContextType } from "./SearchContext";
import { Tool } from "../types/chat";
import { getConfig } from "../config";

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [isEnabled, setEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const config = getConfig();
  const client = config.client;

  // Check search availability from config
  useEffect(() => {
    try {
      const config = getConfig();
      setIsAvailable(config.search.enabled);
    } catch (error) {
      console.warn('Failed to get search config:', error);
      setIsAvailable(false);
    }
  }, []);

  const searchTools = useCallback((): Tool[] => {
    if (!isEnabled) {
      return [];
    }

    return [
      {
        name: "web_search",
        description: "Search the web for current information, recent events, or specific facts",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to find relevant information on the web"
            }
          },
          required: ["query"]
        },
        function: async (args: Record<string, unknown>) => {
          const { query } = args;
          
          try {
            const results = await client.search(config.search.index || "", { text: query as string });
            
            if (results.length === 0) {
              return "No search results found for the given query.";
            }

            return JSON.stringify(results, null, 2);
          } catch (error) {
            console.error("Web search failed:", error);
            return `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
      }
    ];
  }, [isEnabled, client, config.search.index]);

  const searchInstructions = useCallback((): string => {
    if (!isEnabled) {
      return "";
    }

    return "You have access to web search functionality. Use the web_search tool when you need current information, recent events, or specific facts that may not be in your training data. Always search when the user asks for recent information, current events, or specific factual data.";
  }, [isEnabled]);

  const contextValue: SearchContextType = {
    isEnabled,
    setEnabled,
    isAvailable,
    searchTools,
    searchInstructions,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}
