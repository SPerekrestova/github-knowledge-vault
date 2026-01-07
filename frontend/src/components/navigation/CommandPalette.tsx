import { useCallback, useMemo, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  FileText,
  FolderGit2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  File,
} from 'lucide-react';
import type { Conversation, Repository, FileTreeNode } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  repositories: Repository[];
  fileTree: Record<string, FileTreeNode[]>;
  onSelectConversation: (id: string) => void;
  onSelectRepository: (name: string) => void;
  onSelectFile: (repoName: string, filePath: string) => void;
  onNewChat: () => void;
}

// Helper to flatten file tree for searching
const flattenFileTree = (
  nodes: FileTreeNode[],
  repoName: string,
  result: Array<{ repoName: string; node: FileTreeNode }> = []
): Array<{ repoName: string; node: FileTreeNode }> => {
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push({ repoName, node });
    }
    if (node.children) {
      flattenFileTree(node.children, repoName, result);
    }
  }
  return result;
};

export const CommandPalette = ({
  open,
  onOpenChange,
  conversations,
  repositories,
  fileTree,
  onSelectConversation,
  onSelectRepository,
  onSelectFile,
  onNewChat,
}: CommandPaletteProps) => {
  const [search, setSearch] = useState('');

  // Flatten all files for search
  const allFiles = useMemo(() => {
    const files: Array<{ repoName: string; node: FileTreeNode }> = [];
    for (const [repoName, nodes] of Object.entries(fileTree)) {
      flattenFileTree(nodes, repoName, files);
    }
    return files;
  }, [fileTree]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id);
      onOpenChange(false);
      setSearch('');
    },
    [onSelectConversation, onOpenChange]
  );

  const handleSelectRepository = useCallback(
    (name: string) => {
      onSelectRepository(name);
      onOpenChange(false);
      setSearch('');
    },
    [onSelectRepository, onOpenChange]
  );

  const handleSelectFile = useCallback(
    (repoName: string, filePath: string) => {
      onSelectFile(repoName, filePath);
      onOpenChange(false);
      setSearch('');
    },
    [onSelectFile, onOpenChange]
  );

  const handleNewChat = useCallback(() => {
    onNewChat();
    onOpenChange(false);
    setSearch('');
  }, [onNewChat, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search conversations, repositories, and files..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Conversations */}
        <CommandGroup heading="Conversations">
          {conversations.slice(0, 5).map((conversation) => (
            <CommandItem
              key={conversation.id}
              value={`conversation-${conversation.title}`}
              onSelect={() => handleSelectConversation(conversation.id)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span className="truncate">{conversation.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {conversation.messageCount} messages
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Repositories */}
        <CommandGroup heading="Repositories">
          {repositories.map((repo) => (
            <CommandItem
              key={repo.id}
              value={`repo-${repo.name}`}
              onSelect={() => handleSelectRepository(repo.name)}
            >
              <FolderGit2 className="mr-2 h-4 w-4" />
              <span>{repo.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {repo.documentCount} docs
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Files - only show when searching */}
        {search.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Files">
              {allFiles
                .filter(
                  ({ node }) =>
                    node.name.toLowerCase().includes(search.toLowerCase()) ||
                    node.path.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 10)
                .map(({ repoName, node }) => (
                  <CommandItem
                    key={`${repoName}-${node.id}`}
                    value={`file-${repoName}-${node.path}`}
                    onSelect={() => handleSelectFile(repoName, node.path)}
                  >
                    <File className="mr-2 h-4 w-4" />
                    <span className="truncate">{node.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                      {repoName}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
