import { useState } from 'react';
import { Bot } from 'lucide-react';
import { ToolCallBadge } from './ToolCallBadge';
import { StreamingIndicator } from './StreamingIndicator';
import { DocumentReferenceCard } from './DocumentReferenceCard';
import type { Message } from '@/types';

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
  onDocumentClick?: (repo: string, path: string) => void;
}

export function AssistantMessage({
  message,
  isStreaming,
  onDocumentClick,
}: AssistantMessageProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleTool = (toolId: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  return (
    <div className="flex gap-3 animate-slide-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      
      <div className="max-w-2xl flex-1">
        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.toolCalls.map((toolCall) => (
              <ToolCallBadge
                key={toolCall.id}
                toolCall={toolCall}
                isExpanded={expandedTools.has(toolCall.id)}
                onToggle={() => toggleTool(toolCall.id)}
              />
            ))}
          </div>
        )}
        
        {/* Message Content */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-card border border-border">
          {isStreaming && !message.content ? (
            <StreamingIndicator />
          ) : (
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {message.content}
              {isStreaming && <span className="animate-pulse">▊</span>}
            </p>
          )}
        </div>
        
        {/* Document References */}
        {message.documentReferences && message.documentReferences.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Referenced Documents:</p>
            <div className="grid gap-2">
              {message.documentReferences.map((ref, index) => (
                <DocumentReferenceCard
                  key={index}
                  reference={ref}
                  onClick={() => onDocumentClick?.(ref.repo, ref.path)}
                />
              ))}
            </div>
          </div>
        )}
        
        <span className="text-xs text-muted-foreground mt-1 block">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
