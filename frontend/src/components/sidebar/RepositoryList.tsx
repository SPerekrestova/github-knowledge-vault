import { RepositoryItem } from './RepositoryItem';
import { SkeletonList } from '@/components/common/SkeletonList';
import type { Repository } from '@/types';

interface RepositoryListProps {
  repositories: Repository[];
  selectedRepo: string | null;
  onSelectRepo: (name: string) => void;
  isLoading?: boolean;
}

export function RepositoryList({
  repositories,
  selectedRepo,
  onSelectRepo,
  isLoading = false,
}: RepositoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1 mt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
          Repositories
        </div>
        <SkeletonList count={3} variant="repository" />
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="space-y-1 mt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
          Repositories
        </div>
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">
          No repositories connected
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        Repositories
      </div>

      {repositories.map((repo, index) => (
        <div
          key={repo.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <RepositoryItem
            repository={repo}
            isSelected={selectedRepo === repo.name}
            onClick={() => onSelectRepo(repo.name)}
          />
        </div>
      ))}
    </div>
  );
}
