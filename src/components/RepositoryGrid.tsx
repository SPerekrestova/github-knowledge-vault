import { Repository, ContentItem } from '@/types';
import { RepoCard } from './RepoCard';
import { useMemo } from 'react';

interface RepositoryGridProps {
  repositories: Repository[];
  content: ContentItem[];
  onRepoSelect: (repoId: string) => void;
}

/**
 * Grid display of repositories with content counts
 */
export const RepositoryGrid = ({ repositories, content, onRepoSelect }: RepositoryGridProps) => {
  // Get content counts by repository
  const contentCountByRepo = useMemo(() => {
    const counts = new Map<string, { markdown: number; mermaid: number; postman: number }>();
    repositories.forEach(repo => {
      counts.set(repo.id, { markdown: 0, mermaid: 0, postman: 0 });
    });
    content.forEach(item => {
      const repoCount = counts.get(item.repoId);
      if (repoCount) {
        if (item.type === 'postman' || item.type === 'openapi') {
          repoCount.postman += 1; // Count both as API collections
        } else if (item.type === 'markdown') {
          repoCount.markdown += 1;
        } else if (item.type === 'mermaid') {
          repoCount.mermaid += 1;
        }
      }
    });
    return counts;
  }, [repositories, content]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {repositories.map(repo => {
        const contentCount = contentCountByRepo.get(repo.id) || { markdown: 0, mermaid: 0, postman: 0 };
        return (
          <RepoCard
            key={repo.id}
            repo={repo}
            contentCount={contentCount}
            onClick={() => onRepoSelect(repo.id)}
          />
        );
      })}
    </div>
  );
};
