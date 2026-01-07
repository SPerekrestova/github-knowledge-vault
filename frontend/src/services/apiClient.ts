import type { HealthResponse } from '../types/connection';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

class ApiClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return this.request<T>('GET', url.toString());
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();
    return this.request<T>('POST', url, body);
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();
    return this.request<T>('PUT', url, body);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();
    return this.request<T>('DELETE', url);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.config.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await this.parseError(response);
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const apiError: ApiError = new Error('Request timed out');
        apiError.code = 'TIMEOUT';
        throw apiError;
      }
      
      throw error;
    }
  }

  private async parseError(response: Response): Promise<ApiError> {
    let message = `HTTP ${response.status}`;
    let data: unknown;
    
    try {
      data = await response.json();
      if (typeof data === 'object' && data !== null && 'message' in data) {
        message = (data as { message: string }).message;
      }
    } catch {
      // Response is not JSON
    }
    
    const error: ApiError = new Error(message);
    error.status = response.status;
    error.data = data;
    
    return error;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };

// ============================================================
// API ENDPOINTS
// ============================================================

// Types for API responses
interface Repository {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  lastUpdated: string;
}

interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

interface Document {
  id: string;
  repo: string;
  path: string;
  name: string;
  content: string;
  lastModified: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SearchResult {
  repo: string;
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export const api = {
  // Health
  health: {
    check: () => apiClient.get<HealthResponse>('/health'),
  },
  
  // Repositories
  repos: {
    list: () => apiClient.get<Repository[]>('/api/repos'),
    get: (name: string) => apiClient.get<Repository>(`/api/repos/${name}`),
    getTree: (name: string) => apiClient.get<FileTreeNode[]>(`/api/repos/${name}/tree`),
    getFile: (name: string, path: string) => 
      apiClient.get<Document>(`/api/repos/${name}/files/${encodeURIComponent(path)}`),
  },
  
  // Conversations
  conversations: {
    list: () => apiClient.get<Conversation[]>('/api/conversations'),
    create: () => apiClient.post<Conversation>('/api/conversations'),
    get: (id: string) => apiClient.get<Conversation>(`/api/conversations/${id}`),
    delete: (id: string) => apiClient.delete(`/api/conversations/${id}`),
    getMessages: (id: string) => apiClient.get<Message[]>(`/api/conversations/${id}/messages`),
  },
  
  // Search
  search: {
    docs: (query: string, repo?: string) => 
      apiClient.get<SearchResult[]>('/api/search', { q: query, ...(repo && { repo }) }),
  },
};
