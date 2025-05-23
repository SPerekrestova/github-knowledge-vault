
export type ContentType = 'markdown' | 'mermaid' | 'postman';

export interface Repository {
  id: string;
  name: string;
  description: string;
  url: string;
  hasDocFolder: boolean;
}

export interface ContentItem {
  id: string;
  repoId: string;
  name: string;
  path: string;
  type: ContentType;
  content: string;
  lastUpdated: string;
}

export interface FilterOptions {
  repoId: string | null;
  contentType: ContentType | null;
  searchQuery: string;
}
