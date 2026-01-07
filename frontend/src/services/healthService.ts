import type { HealthResponse } from '../types/connection';

type HealthCallback = (health: HealthResponse | null, error: Error | null) => void;

interface HealthServiceConfig {
  baseUrl: string;
  checkInterval: number;
  timeout: number;
}

class HealthService {
  private config: HealthServiceConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<HealthCallback> = new Set();
  private lastHealth: HealthResponse | null = null;
  private lastError: Error | null = null;
  private isMonitoring = false;

  constructor(config: Partial<HealthServiceConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
      checkInterval: config.checkInterval || Number(import.meta.env.VITE_HEALTH_CHECK_INTERVAL) || 30000,
      timeout: config.timeout || Number(import.meta.env.VITE_HEALTH_CHECK_TIMEOUT) || 5000,
    };
  }

  /**
   * Perform a single health check
   */
  async check(): Promise<HealthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }

      const health: HealthResponse = await response.json();
      
      this.lastHealth = health;
      this.lastError = null;
      this.notifyListeners(health, null);
      
      return health;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Provide more specific error messages
      if (err.name === 'AbortError') {
        err.message = 'Health check timed out - server may be unresponsive';
      } else if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        err.message = 'Cannot connect to server - is the backend running?';
      }
      
      this.lastHealth = null;
      this.lastError = err;
      this.notifyListeners(null, err);
      
      throw err;
    }
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Perform initial check
    this.check().catch(() => {
      // Error already handled in check()
    });
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.check().catch(() => {
        // Error already handled in check()
      });
    }, this.config.checkInterval);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Subscribe to health updates
   * @returns Unsubscribe function
   */
  subscribe(callback: HealthCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately emit current state
    if (this.lastHealth || this.lastError) {
      callback(this.lastHealth, this.lastError);
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current health status
   */
  getStatus(): { health: HealthResponse | null; error: Error | null } {
    return {
      health: this.lastHealth,
      error: this.lastError,
    };
  }

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    return this.lastHealth !== null;
  }

  /**
   * Check if specific service is connected
   */
  isServiceConnected(service: 'mcp_server' | 'claude_api' | 'github_api'): boolean {
    if (!this.lastHealth) return false;
    
    const status = this.lastHealth.services[service];
    return status.status === 'connected' || status.status === 'available';
  }

  private notifyListeners(health: HealthResponse | null, error: Error | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(health, error);
      } catch (e) {
        console.error('Health listener error:', e);
      }
    });
  }

  /**
   * Update configuration
   */
  configure(config: Partial<HealthServiceConfig>): void {
    const wasMonitoring = this.isMonitoring;
    
    if (wasMonitoring) {
      this.stopMonitoring();
    }
    
    this.config = { ...this.config, ...config };
    
    if (wasMonitoring) {
      this.startMonitoring();
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();

// Export class for testing
export { HealthService };
