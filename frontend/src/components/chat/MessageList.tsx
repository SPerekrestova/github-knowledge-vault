import { useEffect, useRef } from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  streamingMessageId?: string | null;
  onDocumentClick?: (repo: string, path: string) => void;
}

export function MessageList({
  messages,
  streamingMessageId,
  onDocumentClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div 
      className="py-6 space-y-6 max-w-3xl mx-auto"
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
    >
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            'animate-slide-up',
            index > 0 && 'opacity-0'
          )}
          style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
        >
          {message.role === 'user' ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage
              message={message}
              isStreaming={streamingMessageId === message.id}
              onDocumentClick={onDocumentClick}
            />
          )}
        </div>
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
