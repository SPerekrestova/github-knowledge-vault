import { Repository, ContentItem, ContentType } from '@/types';
import {GitHubRepo} from "@/types/github.ts";
import githubConfig from '@/config/github';


export const githubService = {

  getRepositories: async (): Promise<Repository[]> => {
    const endpoint = githubConfig.ownerType === 'org'
        ? `${githubConfig.apiBaseUrl}/orgs/${githubConfig.owner}/repos`
        : `${githubConfig.apiBaseUrl}/user/repos`;
    const response = await fetch(
        endpoint,
        {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter out repos where owner.login !== githubConfig.owner
    const filteredRepos = repos.filter((repo: GitHubRepo) => repo.owner && repo.owner.login === githubConfig.owner);

    // Check each repo for docs folder
    const reposWithDocs = await Promise.all(
        filteredRepos.map(async (repo: GitHubRepo) => {
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

    return reposWithDocs.filter(repo => repo.hasDocFolder);
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

        // Determine content type by extension
        if (extension === 'md') contentType = 'markdown';
        else if (extension === 'mmd' || extension === 'mermaid') contentType = 'mermaid';
        else if (extension === 'json' && file.name.toLowerCase().includes('postman')) {
          contentType = 'postman';
        }

        if (contentType) {
          try {
            const content = await fetchFileContent(repo.name, file.path);
            contentItems.push({
              id: `${repoId}-${file.sha}`,
              repoId,
              name: file.name,
              path: file.path,
              type: contentType,
              content,
              lastUpdated: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Failed to fetch ${file.path}:`, error);
          }
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
  },

  // TODO: Add refresh functionality to clear cache and fetch fresh data
  refreshAllData: async (): Promise<void> => {
    // No cache to clear: all data is always fetched fresh from GitHub
    // This is a no-op for now, but can be extended if caching is added in the future
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