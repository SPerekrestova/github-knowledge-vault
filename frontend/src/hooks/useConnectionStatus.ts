import { useMemo } from 'react';
import { useHealth } from './useHealth';
import type { ConnectionState, WebSocketStatus } from '../types/connection';

interface UseConnectionStatusOptions {
  conversationId: string | null;
  wsStatus?: WebSocketStatus;
}

export function useConnectionStatus(
  options: UseConnectionStatusOptions
): ConnectionState {
  const { wsStatus = 'disconnected' } = options;
  
  const health = useHealth();

  return useMemo<ConnectionState>(() => ({
    // Overall status
    isOnline: health.isBackendAvailable,
    
    // Backend health
    health: health.health,
    healthStatus: health.isLoading 
      ? 'checking' 
      : health.isBackendAvailable 
        ? health.health?.status ?? 'healthy'
        : 'offline',
    healthError: health.error?.message ?? null,
    lastHealthCheck: health.health 
      ? new Date(health.health.timestamp) 
      : null,
    
    // WebSocket
    wsStatus,
    wsError: null,
    wsReconnectAttempt: 0,
    
    // Derived capabilities
    canSendMessages: health.isBackendAvailable && wsStatus === 'connected',
    canBrowseRepos: health.isBackendAvailable && health.isGitHubConnected,
    canViewDocs: health.isBackendAvailable,
  }), [health, wsStatus]);
}
