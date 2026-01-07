import { FileSearch } from 'lucide-react';
import { FileTreeItem } from './FileTreeItem';
import { EmptyState } from '@/components/common/EmptyState';
import type { FileTreeNode } from '@/types';

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTree({ nodes, selectedPath, onSelectFile }: FileTreeProps) {
  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch className="h-6 w-6 text-muted-foreground" />}
        title="No files found"
        description="Try adjusting your search or check back later"
        size="sm"
      />
    );
  }

  return (
    <div 
      className="space-y-0.5"
      role="tree"
      aria-label="File tree"
    >
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 20}ms` }}
        >
          <FileTreeItem
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        </div>
      ))}
    </div>
  );
}
