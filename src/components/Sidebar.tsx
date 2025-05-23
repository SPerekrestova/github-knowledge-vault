
import { useState } from 'react';
import { useRepos } from '@/hooks/useRepos';
import { ContentType } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeRepoId: string | null;
  activeContentType: ContentType | null;
  onRepoSelect: (repoId: string | null) => void;
  onContentTypeSelect: (contentType: ContentType | null) => void;
  onReset: () => void;
}

export const Sidebar = ({
  activeRepoId,
  activeContentType,
  onRepoSelect,
  onContentTypeSelect,
  onReset
}: SidebarProps) => {
  const { repositories, loading } = useRepos();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const contentTypes: { id: ContentType; label: string }[] = [
    { id: 'markdown', label: 'Documentation' },
    { id: 'mermaid', label: 'Diagrams' },
    { id: 'postman', label: 'API Collections' }
  ];

  return (
    <div 
      className={cn(
        "h-screen transition-all duration-300 bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h2 className={cn("font-semibold", isCollapsed ? "hidden" : "block")}>
          Knowledge Base
        </h2>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-sidebar-accent"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        {/* All Content button */}
        <div className="p-4">
          <button
            onClick={onReset}
            className={cn(
              "flex items-center w-full p-2 rounded transition-colors",
              !activeRepoId && !activeContentType 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "hover:bg-sidebar-accent"
            )}
          >
            <span className={cn("text-left", isCollapsed ? "hidden" : "block")}>All Content</span>
            {isCollapsed && <span>All</span>}
          </button>
        </div>

        {/* Content Type Filters */}
        <div className={cn("p-4 border-t border-sidebar-border", isCollapsed ? "hidden" : "block")}>
          <h3 className="text-xs uppercase text-sidebar-foreground/70 mb-2">Content Types</h3>
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onContentTypeSelect(type.id === activeContentType ? null : type.id)}
              className={cn(
                "flex items-center w-full p-2 rounded transition-colors mb-1",
                activeContentType === type.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              )}
            >
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Repositories */}
        <div className="p-4 border-t border-sidebar-border">
          <h3 className={cn("text-xs uppercase text-sidebar-foreground/70 mb-2", isCollapsed ? "hidden" : "block")}>
            Repositories
          </h3>
          
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sidebar-primary"></div>
            </div>
          ) : (
            <div>
              {repositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onRepoSelect(repo.id === activeRepoId ? null : repo.id)}
                  className={cn(
                    "flex items-center w-full p-2 rounded transition-colors mb-1",
                    activeRepoId === repo.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? repo.name : undefined}
                >
                  {isCollapsed ? (
                    <span>{repo.name.charAt(0)}</span>
                  ) : (
                    <span className="truncate">{repo.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
