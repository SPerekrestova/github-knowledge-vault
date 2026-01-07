import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types';

interface RepositoryItemProps {
  repository: Repository;
  isSelected: boolean;
  onClick: () => void;
}

export function RepositoryItem({
  repository,
  isSelected,
  onClick,
}: RepositoryItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left repo-item rounded-lg px-3 py-2.5 cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-ring',
        isSelected && 'selected'
      )}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`Repository: ${repository.name}, ${repository.documentCount} documents`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Folder
            className={cn(
              'h-4 w-4 shrink-0 transition-colors duration-200',
              isSelected ? 'text-folder-open' : 'text-folder'
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'text-sm truncate transition-colors duration-200',
              isSelected ? 'font-medium text-foreground' : 'text-foreground'
            )}
          >
            {repository.name}
          </span>
        </div>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded shrink-0 ml-2 transition-colors duration-200',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary'
          )}
          aria-label={`${repository.documentCount} documents`}
        >
          {repository.documentCount}
        </span>
      </div>
    </button>
  );
}
