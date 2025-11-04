import { useState } from 'react';
import { useRepos } from '@/hooks/useRepos';
import { ContentType } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { SidebarSkeleton } from './LoadingSkeletons';

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
        "flex flex-col h-screen transition-all duration-300 bg-white text-gray-700 border-r border-gray-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="font-bold text-xl text-gray-800">Knowledge Base</h2>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors",
            isCollapsed ? "w-full text-center" : ""
          )}
        >
          {isCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 text-gray-700">
        {/* All Content button */}
        <div className="mb-6">
          <button
            onClick={onReset}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-md transition-colors text-left text-sm",
              !activeRepoId && !activeContentType 
                ? "bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                : "hover:bg-gray-100",
              isCollapsed ? "justify-center px-0" : ""
            )}
          >
            {!isCollapsed && <span>All Content</span>}
            {isCollapsed && <span>All</span>}
          </button>
        </div>

        {/* Content Type Filters */}
        <div className={cn("border-t border-gray-200 pt-6", isCollapsed ? "hidden" : "block")}>
          <h3 className="text-xs uppercase font-bold text-gray-500 mb-4">Content Types</h3>
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onContentTypeSelect(type.id === activeContentType ? null : type.id)}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md transition-colors mb-1 text-left text-sm",
                activeContentType === type.id
                  ? "bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  : "hover:bg-gray-100",
                isCollapsed ? "justify-center px-0" : ""
              )}
            >
              {!isCollapsed && <span>{type.label}</span>}
              {isCollapsed && <span>{type.label.charAt(0)}</span>}
            </button>
          ))}
        </div>

        {/* Repositories */}
        <div className="border-t border-gray-200 pt-6 mt-4">
          <h3 className={cn("text-xs uppercase font-bold text-gray-500 mb-4", isCollapsed ? "hidden" : "block")}>
            Repositories
          </h3>

          {loading ? (
            <div className={cn(isCollapsed ? "hidden" : "block")}>
              <SidebarSkeleton />
            </div>
          ) : (
            <div>
              {repositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onRepoSelect(repo.id === activeRepoId ? null : repo.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-md transition-colors mb-1 text-left text-sm",
                    activeRepoId === repo.id
                      ? "bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                      : "hover:bg-gray-100",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? repo.name : undefined}
                >
                  {isCollapsed ? (
                    <span className="font-medium">{repo.name.charAt(0)}</span>
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
