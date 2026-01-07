import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import { FileTypeBadge } from './FileTypeBadge';
import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/types';

interface FileTreeItemProps {
  node: FileTreeNode;
  level: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTreeItem({ node, level, selectedPath, onSelectFile }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isFolder = node.type === 'folder';
  const isSelected = selectedPath === node.path;
  const hasChildren = isFolder && node.children && node.children.length > 0;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
    if (isFolder && e.key === 'ArrowRight' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
    if (isFolder && e.key === 'ArrowLeft' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div role={isFolder ? 'group' : undefined}>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md',
          'transition-all duration-150 ease-out',
          'hover:bg-accent/50 focus-ring',
          'hover:scale-[1.01] active:scale-[0.99]',
          isSelected && 'bg-accent text-accent-foreground',
          !isSelected && 'text-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        aria-expanded={isFolder ? isOpen : undefined}
        aria-selected={isSelected}
        role="treeitem"
        aria-label={`${isFolder ? 'Folder' : 'File'}: ${node.name}`}
      >
        {/* Folder toggle or spacer */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0" aria-hidden="true">
          {hasChildren ? (
            <span className={cn('transition-transform duration-200', isOpen && 'rotate-90')}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          ) : isFolder ? null : (
            <span className="w-3.5" />
          )}
        </span>

        {/* Icon */}
        {isFolder ? (
          <span className="transition-transform duration-200">
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-folder shrink-0" aria-hidden="true" />
            ) : (
              <Folder className="h-4 w-4 text-folder shrink-0" aria-hidden="true" />
            )}
          </span>
        ) : (
          <FileTypeIcon fileType={node.fileType || 'unknown'} className="shrink-0" />
        )}

        {/* Name */}
        <span className="truncate flex-1">{node.name}</span>

        {/* File type badge for files */}
        {!isFolder && node.fileType && node.fileType !== 'unknown' && (
          <FileTypeBadge fileType={node.fileType} />
        )}
      </button>

      {/* Children */}
      {hasChildren && isOpen && (
        <div 
          className="animate-fade-in"
          role="group"
          aria-label={`Contents of ${node.name}`}
        >
          {node.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
