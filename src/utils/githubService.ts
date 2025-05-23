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

    // Check each repo for docs folder
    const reposWithDocs = await Promise.all(
        repos.map(async (repo: GitHubRepo) => {
          const hasDocFolder = await githubService.checkDocsFolderExists(repo.name);
          return {
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url,
            hasDocFolder
          };
        })
    );

    return reposWithDocs.filter(repo => repo.hasDocFolder);
  },

  checkDocsFolderExists: async (repoName: string): Promise<boolean> => {
    try {
      const response = await fetch(
          `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repoName}/contents/docs`,
          {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  getRepoContent: async (repoId: string): Promise<ContentItem[]> => {
    // Get the repo name from the ID
    const repos = await githubService.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    if (!repo) throw new Error('Repository not found');

    // Fetch docs folder contents
    const response = await fetch(
        `${githubConfig.apiBaseUrl}/repos/${githubConfig.owner}/${repo.name}/contents/docs`,
        {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
    );

    if (!response.ok) {
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
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Refreshing all content from GitHub...');
        // resolve(githubService.mockContent);
      }, 800);
    });
  },

  // Get content by type
  getContentByType: async (contentType: ContentType): Promise<ContentItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // const filteredContent = githubService.mockContent.filter(item => item.type === contentType);
        // resolve(filteredContent);
      }, 600);
    });
  },

  // Get a specific content item by id
  getContentById: async (contentId: string): Promise<ContentItem | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // const foundContent = githubService.mockContent.find(item => item.id === contentId) || null;
        // resolve(foundContent);
      }, 400);
    });
  },

  // TODO: Add refresh functionality to clear cache and fetch fresh data
  refreshAllData: async (): Promise<void> => {
    // TODO: Clear any cached data
    // TODO: Fetch fresh repositories
    // TODO: Fetch fresh content for all repositories
    console.log('Refreshing all data from GitHub...');
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
