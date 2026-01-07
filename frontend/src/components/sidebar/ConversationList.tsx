import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationItem } from './ConversationItem';
import { SkeletonList } from '@/components/common/SkeletonList';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  maxVisible?: number;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  maxVisible = 10,
  isLoading = false,
}: ConversationListProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleConversations = showAll
    ? conversations
    : conversations.slice(0, maxVisible);
  
  const hasMore = conversations.length > maxVisible;

  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
          Recent Conversations
        </div>
        <SkeletonList count={4} variant="conversation" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
          Recent Conversations
        </div>
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">
          No conversations yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        Recent Conversations
      </div>

      {visibleConversations.map((conversation, index) => (
        <div
          key={conversation.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <ConversationItem
            conversation={conversation}
            isActive={selectedConversationId === conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
          />
        </div>
      ))}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className={cn(
            'w-full text-xs text-primary hover:text-primary-600 font-medium px-3 py-2',
            'flex items-center justify-center gap-1',
            'transition-colors duration-200 focus-ring rounded-md'
          )}
          aria-expanded={showAll}
        >
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
          Show {conversations.length - maxVisible} more
        </button>
      )}
    </div>
  );
}
