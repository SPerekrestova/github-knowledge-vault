import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../services/websocketClient';
import type { 
  WebSocketStatus, 
  ServerMessage, 
  ChatContext 
} from '../types/connection';

interface UseWebSocketOptions {
  /** Conversation ID to connect to */
  conversationId: string | null;
  /** Callback for incoming messages */
  onMessage?: (message: ServerMessage) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback for status changes */
  onStatusChange?: (status: WebSocketStatus) => void;
}

interface UseWebSocketReturn {
  // Status
  status: WebSocketStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  
  // Actions
  sendMessage: (content: string, context?: ChatContext) => void;
  cancel: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { conversationId, onMessage, onError, onStatusChange } = options;
  
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  
  // Use refs to avoid stale closures in callbacks
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onStatusChangeRef.current = onStatusChange;
  }, [onMessage, onError, onStatusChange]);

  // Connect/disconnect based on conversationId
  useEffect(() => {
    if (!conversationId) {
      wsClient.disconnect();
      return;
    }
    
    wsClient.connect(conversationId);
    
    return () => {
      // Don't disconnect on cleanup - let the client manage connection
    };
  }, [conversationId]);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubStatus = wsClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      onStatusChangeRef.current?.(newStatus);
    });
    
    const unsubMessage = wsClient.onMessage((message) => {
      onMessageRef.current?.(message);
    });
    
    const unsubError = wsClient.onError((error) => {
      onErrorRef.current?.(error);
    });
    
    return () => {
      unsubStatus();
      unsubMessage();
      unsubError();
    };
  }, []);

  // Action handlers
  const sendMessage = useCallback((content: string, context?: ChatContext) => {
    wsClient.sendMessage(content, context);
  }, []);
  
  const cancel = useCallback(() => {
    wsClient.cancel();
  }, []);
  
  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);
  
  const reconnect = useCallback(() => {
    if (conversationId) {
      wsClient.disconnect();
      wsClient.connect(conversationId);
    }
  }, [conversationId]);

  return {
    // Status
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    
    // Actions
    sendMessage,
    cancel,
    disconnect,
    reconnect,
  };
}
