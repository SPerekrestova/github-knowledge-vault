import { Bot, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { WelcomeScreen } from './WelcomeScreen';
import type { Message, ConversationContext } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  context?: ConversationContext | null;
  isLoading?: boolean;
  streamingMessageId?: string | null;
  onSendMessage: (message: string) => void;
  onClearContext?: () => void;
  onDocumentClick?: (repo: string, path: string) => void;
}

export function ChatContainer({
  messages,
  context,
  isLoading,
  streamingMessageId,
  onSendMessage,
  onClearContext,
  onDocumentClick,
}: ChatContainerProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Documentation Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Ask questions about your organization's documentation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Context Banner */}
        {context && context.scope === 'repo' && context.repoName && (
          <div className="mt-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary font-bold">⊕</span>
              <span className="text-primary font-medium">Context: {context.repoName}</span>
              <span className="text-muted-foreground">
                — Questions will search this repo first
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearContext}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 text-xs h-7"
            >
              ✕ Clear
            </Button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6">
        {!hasMessages ? (
          <WelcomeScreen onPromptClick={onSendMessage} />
        ) : (
          <MessageList
            messages={messages}
            streamingMessageId={streamingMessageId}
            onDocumentClick={onDocumentClick}
          />
        )}
      </ScrollArea>

      {/* Chat Input */}
      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading}
        placeholder={
          context?.repoName
            ? `Ask about ${context.repoName}...`
            : 'Ask about your documentation...'
        }
      />
    </div>
  );
}
