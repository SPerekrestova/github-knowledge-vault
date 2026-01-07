import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left sidebar-item rounded-lg px-3 py-2.5 cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-ring',
        isActive && 'active'
      )}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`Conversation: ${conversation.title}, ${formatTimeAgo(conversation.updatedAt)}`}
    >
      <div className="flex items-center gap-2">
        <MessageCircle
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm truncate transition-colors duration-200',
              isActive ? 'font-medium text-foreground' : 'text-foreground'
            )}
          >
            {conversation.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTimeAgo(conversation.updatedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
