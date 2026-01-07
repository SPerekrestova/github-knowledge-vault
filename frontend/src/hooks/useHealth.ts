import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import type { HealthResponse, OverallStatus } from '../types/connection';

// Check if mock mode is enabled
const MOCK_BACKEND = import.meta.env.VITE_MOCK_BACKEND === 'true';

// Mock health response for frontend-only development
const MOCK_HEALTH_RESPONSE: HealthResponse = {
  status: 'healthy',
  version: 'mock-1.0.0',
  timestamp: new Date().toISOString(),
  uptime: 0,
  services: {
    mcp_server: { status: 'connected' },
    claude_api: { status: 'available' },
    github_api: { status: 'connected' },
  },
  cache: {
    itemCount: 0,
    hitRate: 0,
  },
};

interface UseHealthOptions {
  /** Start monitoring automatically on mount */
  autoStart?: boolean;
  /** Callback when health status changes */
  onStatusChange?: (status: OverallStatus | 'offline') => void;
}

interface UseHealthReturn {
  // Data
  health: HealthResponse | null;
  error: Error | null;
  
  // Status flags
  isLoading: boolean;
  isBackendAvailable: boolean;
  isMcpConnected: boolean;
  isClaudeAvailable: boolean;
  isGitHubConnected: boolean;
  isMockMode: boolean;
  
  // Derived data
  status: OverallStatus | 'offline';
  cacheItemCount: number;
  
  // Actions
  checkNow: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export function useHealth(options: UseHealthOptions = {}): UseHealthReturn {
  const { autoStart = true, onStatusChange } = options;
  
  // In mock mode, start with mock data and no loading state
  const [health, setHealth] = useState<HealthResponse | null>(
    MOCK_BACKEND ? MOCK_HEALTH_RESPONSE : null
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!MOCK_BACKEND);

  // Compute derived status
  const status: OverallStatus | 'offline' = health?.status ?? 'offline';
  
  // Check health immediately (no-op in mock mode)
  const checkNow = useCallback(async () => {
    if (MOCK_BACKEND) {
      // In mock mode, just update timestamp
      setHealth({
        ...MOCK_HEALTH_RESPONSE,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await healthService.check();
      setHealth(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to health updates (skip in mock mode)
  useEffect(() => {
    if (MOCK_BACKEND) {
      // In mock mode, just trigger the status change callback
      onStatusChange?.('healthy');
      return;
    }
    
    const unsubscribe = healthService.subscribe((newHealth, newError) => {
      setHealth(newHealth);
      setError(newError);
      setIsLoading(false);
      
      const newStatus = newHealth?.status ?? 'offline';
      onStatusChange?.(newStatus);
    });
    
    if (autoStart) {
      healthService.startMonitoring();
    }
    
    return () => {
      unsubscribe();
      if (autoStart) {
        healthService.stopMonitoring();
      }
    };
  }, [autoStart, onStatusChange]);

  return {
    // Data
    health,
    error,
    
    // Status flags
    isLoading,
    isBackendAvailable: MOCK_BACKEND || health !== null,
    isMcpConnected: MOCK_BACKEND || health?.services.mcp_server.status === 'connected',
    isClaudeAvailable: MOCK_BACKEND || health?.services.claude_api.status === 'available',
    isGitHubConnected: MOCK_BACKEND || health?.services.github_api.status === 'connected',
    isMockMode: MOCK_BACKEND,
    
    // Derived data
    status,
    cacheItemCount: health?.cache.itemCount ?? 0,
    
    // Actions
    checkNow,
    startMonitoring: () => !MOCK_BACKEND && healthService.startMonitoring(),
    stopMonitoring: () => !MOCK_BACKEND && healthService.stopMonitoring(),
  };
}
