import { useState, useCallback, useRef } from 'react';
import { simulateStreamingResponse } from '@/services/chatService';
import type { Message, ToolCall, DocumentReference, ConversationContext } from '@/types';

interface UseChatOptions {
  conversationId?: string | null;
  context?: ConversationContext | null;
  onDocumentReference?: (repo: string, path: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  cancelGeneration: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId, context, onDocumentReference } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: conversationId || 'new',
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantId = `msg_${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantId,
      conversationId: conversationId || 'new',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: [],
      documentReferences: [],
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantId);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Use simulated streaming for now (replace with WebSocket when backend is ready)
      const stream = simulateStreamingResponse(content, context);
      
      let accumulatedContent = '';
      const toolCalls: ToolCall[] = [];

      for await (const event of stream) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        switch (event.type) {
          case 'tool_use_start':
            toolCalls.push({
              id: event.toolId!,
              name: event.toolName!,
              status: 'running',
            });
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, toolCalls: [...toolCalls] }
                  : m
              )
            );
            break;

          case 'tool_result':
            const toolIndex = toolCalls.findIndex(t => t.name === event.toolName);
            if (toolIndex !== -1) {
              toolCalls[toolIndex] = {
                ...toolCalls[toolIndex],
                status: 'success',
                result: JSON.stringify(event.result),
                duration: event.duration,
              };
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, toolCalls: [...toolCalls] }
                    : m
                )
              );
            }
            break;

          case 'text':
            accumulatedContent += event.content || '';
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: accumulatedContent }
                  : m
              )
            );
            break;

          case 'done':
            // Add document references based on context
            const docRefs: DocumentReference[] = context?.repoName
              ? [
                  {
                    repo: context.repoName,
                    path: 'docs/getting-started.md',
                    title: 'Getting Started Guide',
                    snippet: 'A comprehensive guide to get you started with the service.',
                  },
                ]
              : [];

            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, documentReferences: docRefs }
                  : m
              )
            );
            break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Update message with error state
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Sorry, an error occurred while processing your request. Please try again.',
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  }, [conversationId, context, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, []);

  return {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    clearMessages,
    setMessages,
    cancelGeneration,
  };
}
