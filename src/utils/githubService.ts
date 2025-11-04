import { Repository, ContentItem, ContentType } from '@/types';
import {GitHubRepo} from "@/types/github.ts";
import githubConfig from '@/config/github';
import yaml from 'js-yaml';
import { APIError, NetworkError } from './errors';
import { CONSTANTS } from '@/constants';

// Type for skipped file information
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

export const githubService = {

  getRepositories: async (): Promise<Repository[]> => {
    // Use GitHub Search API to find repos with /doc folder in one query
    // This is much more efficient than checking each repo individually (N+1 problem fix)
    const ownerPrefix = githubConfig.ownerType === 'org' ? 'org' : 'user';
    const searchQuery = `${ownerPrefix}:${githubConfig.owner} path:doc`;
    const searchEndpoint = `${githubConfig.apiBaseUrl}/search/code?q=${encodeURIComponent(searchQuery)}&per_page=100`;

    try {
      const searchResponse = await fetch(searchEndpoint, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        // Extract unique repository names from search results
        const repoNamesWithDoc = new Set(
          searchData.items
            ?.filter((item: any) => item.path === 'doc' || item.path.startsWith('doc/'))
            .map((item: any) => item.repository.full_name.split('/')[1])
        );

        // Fetch repo details for repos with /doc folder
        const endpoint = githubConfig.ownerType === 'org'
          ? `${githubConfig.apiBaseUrl}/orgs/${githubConfig.owner}/repos?per_page=100`
          : `${githubConfig.apiBaseUrl}/user/repos?per_page=100`;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          throw await APIError.fromResponse(response);
        }

        const repos: GitHubRepo[] = await response.json();

        // Filter repos that have /doc folder
        return repos
          .filter((repo: GitHubRepo) =>
            repo.owner &&
            repo.owner.login === githubConfig.owner &&
            repoNamesWithDoc.has(repo.name)
          )
          .map((repo: GitHubRepo) => ({
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url,
            hasDocFolder: true
          }));
      }
    } catch (searchError) {
      console.warn('Search API failed, falling back to individual checks:', searchError);
    }

    // Fallback: If search fails, use the old method but optimized with Promise.all
    const endpoint = githubConfig.ownerType === 'org'
      ? `${githubConfig.apiBaseUrl}/orgs/${githubConfig.owner}/repos?per_page=100`
      : `${githubConfig.apiBaseUrl}/user/repos?per_page=100`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `token ${githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    const repos: GitHubRepo[] = await response.json();
    const filteredRepos = repos.filter((repo: GitHubRepo) =>
      repo.owner && repo.owner.login === githubConfig.owner
    );

    // Parallel check for /doc folder (optimized with better batching)
    const BATCH_SIZE = 10; // Process 10 repos at a time to avoid overwhelming the API
    const reposWithDocs: Repository[] = [];

    for (let i = 0; i < filteredRepos.length; i += BATCH_SIZE) {
      const batch = filteredRepos.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (repo: GitHubRepo) => {
          const hasDocFolder = await githubService.checkDocsFolderExists(repo.name);
          return {
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url,
            hasDocFolder: hasDocFolder
          };
        })
      );
      reposWithDocs.push(...batchResults.filter(repo => repo.hasDocFolder));
    }

    return reposWithDocs;
  },

  checkDocsFolderExists: async (repoName: string): Promise<boolean> => {
    try {
      const response = await fetch(
          `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repoName}/contents`,
          {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
      );

      // 404 means no doc folder, which is expected for some repos
      if (response.status === CONSTANTS.HTTP_STATUS.NOT_FOUND) {
        return false;
      }

      if (!response.ok) {
        // Log other errors but don't throw (this is a check function)
        console.warn(`Error checking doc folder for ${repoName}:`, response.status);
        return false;
      }

      const items = await response.json();
      return Array.isArray(items) && items.some(item => item.name === CONSTANTS.DOC_FOLDER_NAME && item.type === 'dir');
    } catch (error) {
      // Log network errors but don't throw (this is a check function)
      console.warn(`Network error checking doc folder for ${repoName}:`, error);
      return false;
    }
  },

  getRepoContent: async (repoId: string): Promise<ContentFetchResult> => {
    // Get the repo name from the ID
    const repos = await githubService.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    if (!repo) {
      throw new APIError(CONSTANTS.HTTP_STATUS.NOT_FOUND, CONSTANTS.ERROR_MESSAGES.NOT_FOUND);
    }

    const contentItems: ContentItem[] = [];
    const skippedFilesList: SkippedFile[] = [];

    // Fetch docs folder contents
    let response: Response;
    try {
      response = await fetch(
          `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repo.name}/contents/${CONSTANTS.DOC_FOLDER_NAME}`,
          {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
      );
    } catch (error) {
      // Network or fetch error
      console.error(`Error fetching /${CONSTANTS.DOC_FOLDER_NAME} folder for repo ${repo.name}:`, error);
      throw new NetworkError();
    }

    if (!response.ok) {
      // If the /doc folder is missing (404), return empty (this is expected for some repos)
      if (response.status === CONSTANTS.HTTP_STATUS.NOT_FOUND) {
        return { content: [], skippedFiles: [] };
      }
      throw await APIError.fromResponse(response);
    }

    const files = await response.json();

    // Process each file
    for (const file of files) {
      if (file.type === 'file') {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let contentType: ContentType | null = null;
        let content: string | null = null;
        let skipReason: string | null = null;

        // Markdown
        if (extension === 'md') {
          contentType = 'markdown';
          content = await fetchFileContent(repo.name, file.path);
        }
        // Mermaid diagrams
        else if (extension === 'mmd' || extension === 'mermaid') {
          contentType = 'mermaid';
          content = await fetchFileContent(repo.name, file.path);
        }
        // SVG files
        else if (extension === 'svg') {
          contentType = 'svg';
          content = await fetchFileContent(repo.name, file.path);
        }
        // YAML files: try to detect OpenAPI
        else if (extension === 'yml' || extension === 'yaml') {
          try {
            const rawContent = await fetchFileContent(repo.name, file.path);
            const parsed = yaml.load(rawContent);
            if (parsed && typeof parsed === 'object' && (parsed.openapi || parsed.swagger)) {
              contentType = 'openapi';
              content = rawContent;
            } else {
              skipReason = 'Unrecognized YAML structure';
            }
          } catch (err) {
            skipReason = 'Invalid YAML';
          }
        }
        // JSON files: try to detect Postman or OpenAPI
        else if (extension === 'json') {
          try {
            const rawContent = await fetchFileContent(repo.name, file.path);
            const parsed = JSON.parse(rawContent);
            // Postman detection
            if (parsed.info && (parsed.info.schema || parsed.info.name)) {
              contentType = 'postman';
              content = rawContent;
            }
            // OpenAPI detection
            else if (parsed.openapi || parsed.swagger) {
              contentType = 'openapi';
              content = rawContent;
            } else {
              skipReason = 'Unrecognized JSON structure';
            }
          } catch (err) {
            skipReason = 'Invalid JSON';
          }
        }
        // Other file types: skip
        else {
          skipReason = 'Unsupported file extension';
        }

        if (contentType && content) {
          contentItems.push({
            id: `${repoId}-${file.sha}`,
            repoId,
            name: file.name,
            path: file.path,
            type: contentType as ContentType,
            content,
            lastUpdated: new Date().toISOString()
          });
        } else if (skipReason) {
          skippedFilesList.push({
            name: file.name,
            path: file.path,
            reason: skipReason
          });
        }
      }
    }

    return { content: contentItems, skippedFiles: skippedFilesList };
  },

  // Get all content across all repositories with skipped files
  getAllContentWithSkipped: async (): Promise<{ content: ContentItem[]; skippedFilesByRepo: Record<string, SkippedFile[]> }> => {
    const repos = await githubService.getRepositories();
    const allResults = await Promise.all(
        repos.map(async (repo) => {
          const result = await githubService.getRepoContent(repo.id);
          return { repoId: repo.id, ...result };
        })
    );

    // Aggregate content and skipped files
    const content: ContentItem[] = [];
    const skippedFilesByRepo: Record<string, SkippedFile[]> = {};

    allResults.forEach(result => {
      content.push(...result.content);
      if (result.skippedFiles.length > 0) {
        skippedFilesByRepo[result.repoId] = result.skippedFiles;
      }
    });

    return { content, skippedFilesByRepo };
  },

  // Get all content across all repositories (legacy method for backward compatibility)
  getAllContent: async (): Promise<ContentItem[]> => {
    const result = await githubService.getAllContentWithSkipped();
    return result.content;
  },

  // Get content by type
  getContentByType: async (contentType: ContentType): Promise<ContentItem[]> => {
    const allContent = await githubService.getAllContent();
    return allContent.filter(item => item.type === contentType);
  },

  // Get a specific content item by id
  getContentById: async (contentId: string): Promise<ContentItem | null> => {
    const allContent = await githubService.getAllContent();
    return allContent.find(item => item.id === contentId) || null;
  }
};

const fetchFileContent = async (repoName: string, path: string): Promise<string> => {
  try {
    const response = await fetch(
        `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repoName}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
    );

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    const data = await response.json();
    // GitHub returns content as base64
    return atob(data.content);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new NetworkError();
  }
}