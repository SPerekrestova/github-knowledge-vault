/**
 * MCP Service - REST API client for MCP Bridge
 *
 * Replaces githubService with MCP Bridge communication
 */

import { githubConfig } from '@/config/github';
import type {
  Repository,
  ContentItem,
  ContentType
} from '@/types';
import { APIError, NetworkError } from './errors';

// Type for skipped file information (matching old interface)
export interface SkippedFile {
  name: string;
  path: string;
  reason: string;
}

// Type for content fetch result with skipped files
export interface ContentFetchResult {
  content: ContentItem[];
  skippedFiles: SkippedFile[];
}

class MCPService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = githubConfig.mcpBridgeUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new APIError(
          response.status,
          `MCP Bridge error: ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Cannot connect to MCP Bridge. Is it running?');
      }

      throw new NetworkError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch all repositories from the organization
   */
  async getRepositories(): Promise<Repository[]> {
    console.log('🔄 Fetching repositories from MCP Bridge');

    const repos = await this.fetchWithErrorHandling<Repository[]>(
      `${this.baseUrl}/api/repos`
    );

    console.log(`✅ Received ${repos.length} repositories`);
    return repos;
  }

  /**
   * Check if repository has /doc folder
   * (Info already available from getRepositories)
   */
  async checkDocsFolderExists(repoId: string): Promise<boolean> {
    const repos = await this.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    return repo?.hasDocFolder ?? false;
  }

  /**
   * Fetch content from a specific repository
   */
  async getRepoContent(repoId: string): Promise<ContentFetchResult> {
    console.log(`🔄 Fetching content for repo: ${repoId}`);

    // Get repo name from ID
    const repos = await this.getRepositories();
    const repo = repos.find(r => r.id === repoId);

    if (!repo) {
      throw new APIError(404, `Repository not found: ${repoId}`);
    }

    // Fetch content from MCP Bridge
    const content = await this.fetchWithErrorHandling<ContentItem[]>(
      `${this.baseUrl}/api/content/${repo.name}`
    );

    console.log(`✅ Received ${content.length} content items`);

    return {
      content,
      skippedFiles: [], // Bridge handles filtering
    };
  }

  /**
   * Fetch content from all repositories
   */
  async getAllContentWithSkipped(): Promise<{ content: ContentItem[]; skippedFilesByRepo: Record<string, SkippedFile[]> }> {
    console.log('🔄 Fetching all content from MCP Bridge');

    const content = await this.fetchWithErrorHandling<ContentItem[]>(
      `${this.baseUrl}/api/content/all`
    );

    console.log(`✅ Received ${content.length} total content items`);

    return {
      content,
      skippedFilesByRepo: {}, // Bridge handles filtering
    };
  }

  /**
   * Get all content across all repositories (legacy method for backward compatibility)
   */
  async getAllContent(): Promise<ContentItem[]> {
    const result = await this.getAllContentWithSkipped();
    return result.content;
  }

  /**
   * Filter content by type (client-side)
   */
  getContentByType(
    contentType: ContentType,
    content: ContentItem[]
  ): ContentItem[] {
    return content.filter(item => item.type === contentType);
  }

  /**
   * Get content item by ID (client-side)
   */
  getContentById(id: string, content: ContentItem[]): ContentItem | undefined {
    return content.find(item => item.id === id);
  }

  /**
   * Get content metadata (file counts per repository)
   */
  async getContentMetadata(): Promise<Record<string, { markdown: number; mermaid: number; postman: number; total: number }>> {
    console.log('🔄 Fetching content metadata');

    const repos = await this.getRepositories();
    const metadata: Record<string, { markdown: number; mermaid: number; postman: number; total: number }> = {};

    for (const repo of repos.filter(r => r.hasDocFolder)) {
      try {
        const result = await this.getRepoContent(repo.id);
        const content = result.content;

        const counts = {
          markdown: content.filter(c => c.type === 'markdown').length,
          mermaid: content.filter(c => c.type === 'mermaid').length,
          postman: content.filter(c => c.type === 'postman' || c.type === 'openapi').length,
          total: content.length
        };

        metadata[repo.id] = counts;
      } catch (error) {
        console.warn(`Failed to fetch metadata for ${repo.name}:`, error);
        metadata[repo.id] = { markdown: 0, mermaid: 0, postman: 0, total: 0 };
      }
    }

    return metadata;
  }

  /**
   * Search documentation across organization
   */
  async searchDocumentation(query: string): Promise<any[]> {
    console.log(`🔍 Searching for: "${query}"`);

    const results = await this.fetchWithErrorHandling<any[]>(
      `${this.baseUrl}/api/search`,
      {
        method: 'POST',
        body: JSON.stringify({ query }),
      }
    );

    console.log(`✅ Found ${results.length} search results`);
    return results;
  }

  /**
   * Clear MCP Bridge cache
   */
  async clearCache(): Promise<void> {
    console.log('🗑️ Clearing MCP Bridge cache');

    await this.fetchWithErrorHandling(
      `${this.baseUrl}/api/cache/clear`,
      { method: 'POST' }
    );

    console.log('✅ Cache cleared');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    cache_size: number;
    mcp_connected: boolean;
  }> {
    return await this.fetchWithErrorHandling(
      `${this.baseUrl}/health`
    );
  }
}

// Export singleton instance
export const mcpService = new MCPService();

// Export default for compatibility
export default mcpService;
