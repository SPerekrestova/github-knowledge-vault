// ==================== CHAT ====================

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  context?: ConversationContext;
}

export interface ConversationContext {
  scope: 'global' | 'repo';
  repoName?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  documentReferences?: DocumentReference[];
}

export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: Record<string, unknown>;
  result?: string;
  error?: string;
  duration?: number;
}

export interface DocumentReference {
  repo: string;
  path: string;
  title: string;
  snippet?: string;
}

// ==================== REPOSITORY ====================

export interface Repository {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  lastUpdated: Date;
  defaultBranch: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  fileType?: FileType;
  size?: number;
  lastModified?: Date;
}

export type FileType =
  | 'markdown'
  | 'mermaid'
  | 'openapi'
  | 'postman'
  | 'json'
  | 'yaml'
  | 'svg'
  | 'unknown';

// ==================== DOCUMENT ====================

export interface Document {
  id: string;
  repo: string;
  path: string;
  name: string;
  content: string;
  fileType: FileType;
  lastModified: Date;
  version?: string;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  title?: string;
  description?: string;
  author?: string;
  tags?: string[];
}

// ==================== APP STATE ====================

export type RightPanelMode = 'empty' | 'browser' | 'document';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface AppState {
  // Selection state
  selectedRepo: string | null;
  selectedFile: string | null;
  selectedConversationId: string | null;

  // UI state
  rightPanelMode: RightPanelMode;
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // Context
  chatContext: ConversationContext | null;

  // Connection
  connectionStatus: ConnectionStatus;

  // Actions
  selectRepo: (repoName: string | null) => void;
  selectFile: (filePath: string | null) => void;
  selectConversation: (conversationId: string | null) => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  setChatContext: (context: ConversationContext | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
}

// ==================== WEBSOCKET ====================

export interface WebSocketMessage {
  type: 'text' | 'tool_use_start' | 'tool_use_end' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolId?: string;
  result?: unknown;
  error?: string;
}

export interface ChatStreamEvent {
  type: 'chunk' | 'tool' | 'complete' | 'error';
  data: unknown;
}
