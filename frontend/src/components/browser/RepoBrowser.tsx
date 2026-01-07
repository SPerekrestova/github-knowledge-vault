import { useState, useMemo } from 'react';
import { GitBranch, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SearchInput } from './SearchInput';
import { FileTree } from './FileTree';
import type { Repository, FileTreeNode } from '@/types';

interface RepoBrowserProps {
  repository: Repository;
  fileTree: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Helper function to filter tree by search query
function filterTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  const lowerQuery = query.toLowerCase();
  
  return nodes
    .map((node) => {
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      
      if (node.name.toLowerCase().includes(lowerQuery)) {
        return node;
      }
      
      return null;
    })
    .filter((node): node is FileTreeNode => node !== null);
}

export function RepoBrowser({
  repository,
  fileTree,
  selectedPath,
  onSelectFile,
  onRefresh,
  isLoading = false,
}: RepoBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return fileTree;
    return filterTree(fileTree, searchQuery.trim());
  }, [fileTree, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">{repository.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <GitBranch className="h-3 w-3" />
              <span>{repository.defaultBranch}</span>
              <span className="mx-1">•</span>
              <span>{repository.documentCount} docs</span>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search files..."
        />
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FileTree
              nodes={filteredTree}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
