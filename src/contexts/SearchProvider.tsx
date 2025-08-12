import { useState, ReactNode, useCallback } from "react";
import { SearchContext, SearchContextType } from "./SearchContext";
import { Tool } from "../types/chat";
import { getConfig } from "../config";

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [isSearchEnabled, setSearchEnabled] = useState(false);
  const config = getConfig();
  const client = config.client;

  const searchTools = useCallback((): Tool[] => {
    if (!isSearchEnabled) {
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
            const results = await client.search("web", { text: query as string });
            
            if (results.length === 0) {
              return "No search results found for the given query.";
            }

            // Format results for the assistant
            const formattedResults = results.slice(0, 5).map((result, index) => {
              let formatted = `${index + 1}. ${result.content}`;
              if (result.title) {
                formatted = `${index + 1}. **${result.title}**\n${result.content}`;
              }
              if (result.source) {
                formatted += `\n*Source: ${result.source}*`;
              }
              return formatted;
            }).join('\n\n');

            return `Web search results for "${query}":\n\n${formattedResults}`;
          } catch (error) {
            console.error("Web search failed:", error);
            return `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
      }
    ];
  }, [isSearchEnabled, client]);

  const searchInstructions = useCallback((): string => {
    if (!isSearchEnabled) {
      return "";
    }

    return "You have access to web search functionality. Use the web_search tool when you need current information, recent events, or specific facts that may not be in your training data. Always search when the user asks for recent information, current events, or specific factual data.";
  }, [isSearchEnabled]);

  const contextValue: SearchContextType = {
    isSearchEnabled,
    setSearchEnabled,
    searchTools,
    searchInstructions,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}
