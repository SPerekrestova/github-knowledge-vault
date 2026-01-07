import type {
  WebSocketStatus,
  WebSocketConfig,
  ServerMessage,
  ClientMessage,
  ChatContext,
} from '../types/connection';

type MessageHandler = (message: ServerMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;
type ErrorHandler = (error: Error) => void;

const DEFAULT_CONFIG: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  reconnect: import.meta.env.VITE_WS_RECONNECT !== 'false',
  maxReconnectAttempts: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
  reconnectInterval: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 1000,
  maxReconnectInterval: Number(import.meta.env.VITE_WS_MAX_RECONNECT_INTERVAL) || 30000,
  heartbeatInterval: Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
};

class WebSocketClient {
  private config: WebSocketConfig;
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private conversationId: string | null = null;
  
  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private currentReconnectInterval: number;
  
  // Heartbeat state
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastPongTime: number = 0;
  
  // Event handlers
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  
  // Message queue for offline messages
  private messageQueue: ClientMessage[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentReconnectInterval = this.config.reconnectInterval;
  }

  /**
   * Connect to WebSocket for a specific conversation
   */
  connect(conversationId: string): void {
    // Disconnect existing connection if different conversation
    if (this.ws && this.conversationId !== conversationId) {
      this.disconnect();
    }
    
    // Don't reconnect if already connected to same conversation
    if (this.ws?.readyState === WebSocket.OPEN && this.conversationId === conversationId) {
      return;
    }
    
    this.conversationId = conversationId;
    this.setStatus('connecting');
    
    const wsUrl = `${this.config.url}/ws/chat/${conversationId}`;
    
    try {
      console.log('[WS] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WS] WebSocket creation error:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.setStatus('connected');
      this.resetReconnection();
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        
        // Handle pong messages internally
        if (message.type === 'pong') {
          this.lastPongTime = Date.now();
          return;
        }
        
        this.notifyMessageHandlers(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error, event.data);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('[WS] Closed:', event.code, event.reason);
      this.stopHeartbeat();
      
      // Normal closure (1000) or going away (1001) - don't reconnect
      if (event.code === 1000 || event.code === 1001) {
        this.setStatus('disconnected');
        return;
      }
      
      // Abnormal closure - attempt reconnection
      if (this.config.reconnect && this.conversationId) {
        this.attemptReconnect();
      } else {
        this.setStatus('disconnected');
      }
    };

    this.ws.onerror = (event: Event) => {
      console.error('[WS] Error:', event);
      const error = new Error('WebSocket connection error');
      this.notifyErrorHandlers(error);
    };
  }

  /**
   * Send a chat message
   */
  sendMessage(content: string, context?: ChatContext): void {
    const message: ClientMessage = {
      type: 'message',
      content,
      context,
    };
    
    this.send(message);
  }

  /**
   * Cancel the current streaming response
   */
  cancel(): void {
    this.send({ type: 'cancel' });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.clearReconnection();
    this.stopHeartbeat();
    
    if (this.ws) {
      // Remove handlers to prevent reconnection attempts
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      if (this.ws.readyState === WebSocket.OPEN || 
          this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnected');
      }
      
      this.ws = null;
    }
    
    this.conversationId = null;
    this.setStatus('disconnected');
  }

  /**
   * Subscribe to incoming messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    // Immediately emit current status
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Get reconnect attempts
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      if (message.type === 'message') {
        this.messageQueue.push(message);
        console.log('[WS] Message queued (connection not ready)');
      }
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) return;
    
    this.status = status;
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (e) {
        console.error('[WS] Status handler error:', e);
      }
    });
  }

  private notifyMessageHandlers(message: ServerMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (e) {
        console.error('[WS] Message handler error:', e);
      }
    });
  }

  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('[WS] Error handler error:', e);
      }
    });
  }

  private handleConnectionError(error: Error): void {
    this.notifyErrorHandlers(error);
    
    if (this.config.reconnect && this.conversationId) {
      this.attemptReconnect();
    } else {
      this.setStatus('failed');
    }
  }

  // ============================================================
  // RECONNECTION LOGIC
  // ============================================================

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('[WS] Max reconnection attempts reached');
      this.setStatus('failed');
      this.notifyErrorHandlers(new Error('Failed to reconnect after maximum attempts'));
      return;
    }
    
    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    
    console.log(
      `[WS] Reconnecting in ${this.currentReconnectInterval}ms ` +
      `(attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );
    
    this.reconnectTimeoutId = setTimeout(() => {
      if (this.conversationId) {
        this.connect(this.conversationId);
      }
    }, this.currentReconnectInterval);
    
    // Exponential backoff
    this.currentReconnectInterval = Math.min(
      this.currentReconnectInterval * 2,
      this.config.maxReconnectInterval
    );
  }

  private resetReconnection(): void {
    this.reconnectAttempts = 0;
    this.currentReconnectInterval = this.config.reconnectInterval;
    this.clearReconnection();
  }

  private clearReconnection(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  // ============================================================
  // HEARTBEAT LOGIC
  // ============================================================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    
    this.heartbeatIntervalId = setInterval(() => {
      // Check if we've received a pong recently
      const timeSinceLastPong = Date.now() - this.lastPongTime;
      if (timeSinceLastPong > this.config.heartbeatInterval * 2) {
        console.log('[WS] Heartbeat timeout - connection may be dead');
        this.ws?.close(4000, 'Heartbeat timeout');
        return;
      }
      
      // Send ping
      this.send({ type: 'ping' });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Export class for testing
export { WebSocketClient };

// Re-export types for backward compatibility
export type { WebSocketStatus as ConnectionStatus };
