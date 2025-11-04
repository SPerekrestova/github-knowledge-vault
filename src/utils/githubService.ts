import { Repository, ContentItem, ContentType } from '@/types';
import {GitHubRepo} from "@/types/github.ts";
import githubConfig from '@/config/github';
import yaml from 'js-yaml';

// Map to store skipped files per repo for UI display
export const skippedFiles: { [repoId: string]: { name: string; path: string; reason: string }[] } = {};

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
          throw new Error(`GitHub API error: ${response.status}`);
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
      throw new Error(`GitHub API error: ${response.status}`);
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
      if (!response.ok) {
        return false;
      }
      const items = await response.json();
      return Array.isArray(items) && items.some(item => item.name === 'doc' && item.type === 'dir');
    } catch (error) {
      // Silently handle errors and return false
      return false;
    }
  },

  getRepoContent: async (repoId: string): Promise<ContentItem[]> => {
    // Get the repo name from the ID
    const repos = await githubService.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    if (!repo) throw new Error('Repository not found');

    // Clear skipped files for this repo
    skippedFiles[repoId] = [];

    // Fetch docs folder contents
    let response: Response;
    try {
      response = await fetch(
          `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repo.name}/contents/doc`,
          {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
      );
    } catch (error) {
      // Network or fetch error, skip this repo
      console.error(`Error fetching /doc folder for repo ${repo.name}:`, error);
      return [];
    }

    if (!response.ok) {
      // If the /doc folder is missing (404), skip this repo
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch docs: ${response.status}`);
    }

    const files = await response.json();
    const contentItems: ContentItem[] = [];

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
          skippedFiles[repoId].push({
            name: file.name,
            path: file.path,
            reason: skipReason
          });
        }
      }
    }

    return contentItems;
  },

  // Get all content across all repositories
  getAllContent: async (): Promise<ContentItem[]> => {
    const repos = await githubService.getRepositories();
    const allContentArrays = await Promise.all(
        repos.map(async (repo) => {
          return githubService.getRepoContent(repo.id);
        })
    );
    // Flatten the array of arrays
    return allContentArrays.flat();
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
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const data = await response.json();
  // GitHub returns content as base64
  return atob(data.content);
}