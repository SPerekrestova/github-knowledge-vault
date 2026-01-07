import { ScrollArea } from '@/components/ui/scroll-area';
import { NewChatButton } from '@/components/sidebar/NewChatButton';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { RepositoryList } from '@/components/sidebar/RepositoryList';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { cn } from '@/lib/utils';
import type { Conversation, Repository } from '@/types';

interface SidebarProps {
  conversations: Conversation[];
  repositories: Repository[];
  selectedConversationId: string | null;
  selectedRepo: string | null;
  isCollapsed?: boolean;
  isLoading?: boolean;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSelectRepo: (name: string) => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  conversations,
  repositories,
  selectedConversationId,
  selectedRepo,
  isCollapsed = false,
  isLoading = false,
  onNewChat,
  onSelectConversation,
  onSelectRepo,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'bg-card border-r border-border flex flex-col shrink-0',
        'transition-all duration-300 ease-out',
        isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* New Chat Button */}
      <NewChatButton onClick={onNewChat} />

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Recent Conversations */}
          <nav aria-label="Recent conversations">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={onSelectConversation}
              isLoading={isLoading}
            />
          </nav>

          {/* Repositories */}
          <nav aria-label="Repositories" className="mt-4">
            <RepositoryList
              repositories={repositories}
              selectedRepo={selectedRepo}
              onSelectRepo={onSelectRepo}
              isLoading={isLoading}
            />
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter repositories={repositories} />
    </aside>
  );
}
