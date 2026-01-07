import { ChevronRight, Home, FolderGit2, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  repoName?: string | null;
  filePath?: string | null;
  onNavigateHome?: () => void;
  onNavigateRepo?: () => void;
  className?: string;
}

export const Breadcrumbs = ({
  repoName,
  filePath,
  onNavigateHome,
  onNavigateRepo,
  className,
}: BreadcrumbsProps) => {
  // Parse file path into segments
  const pathSegments = filePath ? filePath.split('/').filter(Boolean) : [];
  const fileName = pathSegments.pop();
  const folderPath = pathSegments;

  return (
    <nav
      className={cn(
        'flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto',
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </button>

      {/* Repository */}
      {repoName && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <button
            onClick={onNavigateRepo}
            className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{repoName}</span>
          </button>
        </>
      )}

      {/* Folder path segments */}
      {folderPath.map((segment, index) => (
        <span key={index} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate max-w-[80px]">{segment}</span>
        </span>
      ))}

      {/* File name */}
      {fileName && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="flex items-center gap-1 text-foreground font-medium shrink-0">
            <File className="h-3.5 w-3.5" />
            <span className="truncate max-w-[150px]">{fileName}</span>
          </span>
        </>
      )}
    </nav>
  );
};
