import type { Message, ToolCall, DocumentReference, ConversationContext } from '@/types';

// Mock API service - replace with real API calls when backend is ready
const API_BASE_URL = '/api';

export interface ChatMessageRequest {
  content: string;
  conversationId?: string;
  context?: ConversationContext | null;
}

export interface ChatMessageResponse {
  messageId: string;
  conversationId: string;
}

// Simulated streaming response for demo mode
export async function* simulateStreamingResponse(
  userMessage: string,
  context?: ConversationContext | null
): AsyncGenerator<{
  type: 'text' | 'tool_use_start' | 'tool_result' | 'done';
  content?: string;
  toolId?: string;
  toolName?: string;
  result?: unknown;
  duration?: number;
}> {
  // Simulate tool call start
  yield {
    type: 'tool_use_start',
    toolId: 'tool_' + Date.now(),
    toolName: 'search_docs',
  };

  // Simulate tool processing time
  await delay(800);

  // Simulate tool result
  yield {
    type: 'tool_result',
    toolId: 'tool_' + Date.now(),
    toolName: 'search_docs',
    result: { found: 3, query: userMessage },
    duration: 287,
  };

  // Simulate streaming text response
  const responseText = generateMockResponse(userMessage, context);
  const words = responseText.split(' ');

  for (let i = 0; i < words.length; i++) {
    await delay(30 + Math.random() * 20);
    yield {
      type: 'text',
      content: words[i] + (i < words.length - 1 ? ' ' : ''),
    };
  }

  yield { type: 'done' };
}

function generateMockResponse(query: string, context?: ConversationContext | null): string {
  const repoName = context?.repoName || 'your repositories';
  
  const responses = [
    `I found relevant documentation for your query about "${query}" in ${repoName}.\n\n**Key findings:**\n\n1. **API Reference** - Complete endpoint documentation\n2. **Getting Started Guide** - Setup and configuration\n3. **Examples** - Code samples and tutorials\n\nWould you like me to elaborate on any of these?`,
    
    `Based on my search of ${repoName}, here's what I found about "${query}":\n\n• The main documentation covers this topic in the **guides/** folder\n• There are related API endpoints in **api-reference.md**\n• Check the **examples/** directory for implementation samples\n\nShall I show you any specific document?`,
    
    `Looking through ${repoName} for "${query}"...\n\nI found **3 relevant documents**:\n\n1. **overview.md** - High-level architecture\n2. **implementation.md** - Detailed implementation guide\n3. **troubleshooting.md** - Common issues and solutions\n\nClick on any document reference below to view the full content.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API functions (placeholder for real implementation)
export async function fetchConversations(): Promise<Message[]> {
  // TODO: Implement real API call
  return [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  // TODO: Implement real API call
  console.log('Fetching messages for conversation:', conversationId);
  return [];
}

export async function createConversation(): Promise<{ id: string }> {
  // TODO: Implement real API call
  return { id: 'conv_' + Date.now() };
}

export async function deleteConversation(conversationId: string): Promise<void> {
  // TODO: Implement real API call
  console.log('Deleting conversation:', conversationId);
}
