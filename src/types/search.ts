export interface SearchQuery {
  text: string;
}

export interface SearchResult {
  title?: string;
  source?: string;
  content: string;
}
