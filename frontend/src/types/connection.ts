// ============================================================
// HEALTH CHECK TYPES
// ============================================================

export type ServiceStatus = 'connected' | 'disconnected' | 'error';
export type ApiStatus = 'available' | 'unavailable' | 'rate_limited';
export type OverallStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface McpServiceStatus {
  status: ServiceStatus;
  lastPing?: string;
  version?: string;
}

export interface ClaudeApiStatus {
  status: ApiStatus;
  model?: string;
  lastUsed?: string;
}

export interface GitHubApiStatus {
  status: ServiceStatus | 'rate_limited';
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: string;  // ISO timestamp
  };
}

export interface CacheStatus {
  itemCount: number;
  hitRate: number;
  memoryUsage?: number;
}

export interface HealthResponse {
  status: OverallStatus;
  version: string;
  timestamp: string;
  uptime: number;  // seconds
  services: {
    mcp_server: McpServiceStatus;
    claude_api: ClaudeApiStatus;
    github_api: GitHubApiStatus;
  };
  cache: CacheStatus;
}

// ============================================================
// WEBSOCKET TYPES
// ============================================================

export type WebSocketStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'reconnecting'
  | 'failed';

export interface WebSocketConfig {
  url: string;
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;  // base interval in ms
  maxReconnectInterval: number;  // max interval after backoff
  heartbeatInterval: number;  // ping interval in ms
}

// Messages FROM server TO client
export type ServerMessageType = 
  | 'text'           // Text chunk from Claude
  | 'tool_use_start' // Tool execution started
  | 'tool_use_end'   // Tool execution ended
  | 'tool_result'    // Tool result received
  | 'done'           // Stream complete
  | 'error'          // Error occurred
  | 'pong';          // Heartbeat response

export interface ServerMessage {
  type: ServerMessageType;
  id?: string;
  content?: string;
  toolId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  messageId?: string;
  timestamp?: string;
}

// Messages FROM client TO server
export type ClientMessageType = 
  | 'message'  // Send chat message
  | 'cancel'   // Cancel current stream
  | 'ping';    // Heartbeat

export interface ClientMessage {
  type: ClientMessageType;
  content?: string;
  context?: ChatContext;
}

export interface ChatContext {
  scope: 'global' | 'repo';
  repoName?: string;
}

// ============================================================
// CONNECTION STATE TYPES
// ============================================================

export interface ConnectionState {
  // Overall status
  isOnline: boolean;
  
  // Backend health
  health: HealthResponse | null;
  healthStatus: 'checking' | 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  healthError: string | null;
  lastHealthCheck: Date | null;
  
  // WebSocket
  wsStatus: WebSocketStatus;
  wsError: string | null;
  wsReconnectAttempt: number;
  
  // Derived status
  canSendMessages: boolean;
  canBrowseRepos: boolean;
  canViewDocs: boolean;
}

// ============================================================
// EVENT TYPES
// ============================================================

export type ConnectionEventType =
  | 'health:success'
  | 'health:error'
  | 'ws:connecting'
  | 'ws:connected'
  | 'ws:disconnected'
  | 'ws:reconnecting'
  | 'ws:failed'
  | 'ws:message'
  | 'ws:error';

export interface ConnectionEvent {
  type: ConnectionEventType;
  timestamp: Date;
  data?: unknown;
  error?: Error;
}
