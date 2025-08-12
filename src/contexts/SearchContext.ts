import { createContext } from "react";
import { Tool } from "../types/chat";

export interface SearchContextType {
  isSearchEnabled: boolean;
  setSearchEnabled: (enabled: boolean) => void;
  searchTools: () => Tool[];
  searchInstructions: () => string;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);
