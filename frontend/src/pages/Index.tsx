import { useEffect, useMemo, useCallback, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { RightPanelEmpty } from '@/components/common/RightPanelEmpty';
import { RepoBrowser } from '@/components/browser/RepoBrowser';
import { DocumentViewer } from '@/components/viewer/DocumentViewer';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { KeyboardShortcutsHelp } from '@/components/navigation/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/stores/appStore';
import { useChat } from '@/hooks/useChat';
import { useToast } from '@/hooks/use-toast';
import type { Conversation, Repository, Message, FileTreeNode, Document } from '@/types';

// Mock data for development
const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Payment API docs',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 5,
  },
  {
    id: '2',
    title: 'Auth service setup',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messageCount: 3,
  },
  {
    id: '3',
    title: 'Database schema comparison',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    id: '4',
    title: 'API rate limiting strategy',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messageCount: 4,
  },
  {
    id: '5',
    title: 'Webhook implementation',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messageCount: 6,
  },
];

const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'payment-service',
    description: 'Payment processing service',
    documentCount: 12,
    lastUpdated: new Date(),
    defaultBranch: 'main',
  },
  {
    id: '2',
    name: 'auth-service',
    description: 'Authentication service',
    documentCount: 8,
    lastUpdated: new Date(),
    defaultBranch: 'main',
  },
  {
    id: '3',
    name: 'user-management',
    description: 'User management service',
    documentCount: 5,
    lastUpdated: new Date(),
    defaultBranch: 'main',
  },
  {
    id: '4',
    name: 'notification-hub',
    description: 'Notification service',
    documentCount: 3,
    lastUpdated: new Date(),
    defaultBranch: 'main',
  },
];

// Mock file tree data
const mockFileTree: Record<string, FileTreeNode[]> = {
  'payment-service': [
    {
      id: 'docs',
      name: 'docs',
      path: 'docs',
      type: 'folder',
      children: [
        { id: 'api-ref', name: 'api-reference.md', path: 'docs/api-reference.md', type: 'file', fileType: 'markdown' },
        { id: 'webhooks', name: 'webhooks.md', path: 'docs/webhooks.md', type: 'file', fileType: 'markdown' },
        { id: 'architecture', name: 'architecture.mmd', path: 'docs/architecture.mmd', type: 'file', fileType: 'mermaid' },
        { id: 'openapi', name: 'openapi.yaml', path: 'docs/openapi.yaml', type: 'file', fileType: 'openapi' },
      ],
    },
    {
      id: 'examples',
      name: 'examples',
      path: 'examples',
      type: 'folder',
      children: [
        { id: 'postman', name: 'postman-collection.json', path: 'examples/postman-collection.json', type: 'file', fileType: 'postman' },
        { id: 'config', name: 'config.yaml', path: 'examples/config.yaml', type: 'file', fileType: 'yaml' },
      ],
    },
    { id: 'readme', name: 'README.md', path: 'README.md', type: 'file', fileType: 'markdown' },
    { id: 'changelog', name: 'CHANGELOG.md', path: 'CHANGELOG.md', type: 'file', fileType: 'markdown' },
  ],
  'auth-service': [
    {
      id: 'docs',
      name: 'docs',
      path: 'docs',
      type: 'folder',
      children: [
        { id: 'setup', name: 'setup-guide.md', path: 'docs/setup-guide.md', type: 'file', fileType: 'markdown' },
        { id: 'oauth', name: 'oauth-flow.mmd', path: 'docs/oauth-flow.mmd', type: 'file', fileType: 'mermaid' },
        { id: 'api', name: 'api.yaml', path: 'docs/api.yaml', type: 'file', fileType: 'openapi' },
      ],
    },
    { id: 'readme', name: 'README.md', path: 'README.md', type: 'file', fileType: 'markdown' },
  ],
  'user-management': [
    {
      id: 'docs',
      name: 'docs',
      path: 'docs',
      type: 'folder',
      children: [
        { id: 'users', name: 'users-api.md', path: 'docs/users-api.md', type: 'file', fileType: 'markdown' },
        { id: 'roles', name: 'roles.json', path: 'docs/roles.json', type: 'file', fileType: 'json' },
      ],
    },
    { id: 'readme', name: 'README.md', path: 'README.md', type: 'file', fileType: 'markdown' },
  ],
  'notification-hub': [
    { id: 'readme', name: 'README.md', path: 'README.md', type: 'file', fileType: 'markdown' },
    { id: 'templates', name: 'templates.json', path: 'templates.json', type: 'file', fileType: 'json' },
  ],
};

// Mock document content
const mockDocuments: Record<string, Document> = {
  'docs/api-reference.md': {
    id: 'doc-1',
    repo: 'payment-service',
    path: 'docs/api-reference.md',
    name: 'api-reference.md',
    fileType: 'markdown',
    lastModified: new Date(),
    content: `# Payment API Reference

Welcome to the Payment Service API documentation. This guide covers all available endpoints for processing payments.

## Authentication

All API requests require authentication using an API key. Include your key in the \`Authorization\` header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/v1/payments
\`\`\`

## Endpoints

### Create Payment

\`POST /v1/payments\`

Creates a new payment transaction.

**Request Body:**

\`\`\`json
{
  "amount": 1000,
  "currency": "USD",
  "description": "Order #12345",
  "customer_id": "cust_abc123"
}
\`\`\`

**Response:**

\`\`\`json
{
  "id": "pay_xyz789",
  "status": "pending",
  "amount": 1000,
  "currency": "USD",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

### Get Payment

\`GET /v1/payments/:id\`

Retrieves details of an existing payment.

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The payment ID |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Payment doesn't exist |
| 500 | Internal Server Error |

> **Note:** All timestamps are returned in ISO 8601 format.
`,
  },
  'docs/webhooks.md': {
    id: 'doc-2',
    repo: 'payment-service',
    path: 'docs/webhooks.md',
    name: 'webhooks.md',
    fileType: 'markdown',
    lastModified: new Date(),
    content: `# Webhook Integration

Webhooks allow you to receive real-time notifications about payment events.

## Setup

1. Navigate to your dashboard
2. Go to **Settings > Webhooks**
3. Add your endpoint URL
4. Select events to subscribe to

## Events

- \`payment.created\` - A new payment was initiated
- \`payment.completed\` - Payment was successful
- \`payment.failed\` - Payment failed
- \`refund.created\` - A refund was initiated

## Payload Example

\`\`\`json
{
  "event": "payment.completed",
  "data": {
    "id": "pay_xyz789",
    "amount": 1000,
    "currency": "USD"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
\`\`\`
`,
  },
  'README.md': {
    id: 'doc-3',
    repo: 'payment-service',
    path: 'README.md',
    name: 'README.md',
    fileType: 'markdown',
    lastModified: new Date(),
    content: `# Payment Service

A robust payment processing service built for scale.

## Features

- ✅ Multiple payment methods
- ✅ Webhook notifications
- ✅ PCI DSS compliant
- ✅ Real-time fraud detection

## Quick Start

\`\`\`bash
bun install @acme/payments-sdk
\`\`\`

\`\`\`typescript
import { PaymentsClient } from '@acme/payments-sdk';

const client = new PaymentsClient({ apiKey: 'your-key' });

const payment = await client.payments.create({
  amount: 1000,
  currency: 'USD',
});
\`\`\`

## Documentation

See the [docs](./docs) folder for complete documentation.
`,
  },
  'docs/openapi.yaml': {
    id: 'doc-4',
    repo: 'payment-service',
    path: 'docs/openapi.yaml',
    name: 'openapi.yaml',
    fileType: 'openapi',
    lastModified: new Date(),
    content: `openapi: 3.0.3
info:
  title: Payment Service API
  version: 2.1.0
  description: API for processing payments
servers:
  - url: https://api.example.com/v1
paths:
  /payments:
    post:
      summary: Create a payment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                amount:
                  type: integer
                currency:
                  type: string
      responses:
        '201':
          description: Payment created
`,
  },
  'examples/postman-collection.json': {
    id: 'doc-5',
    repo: 'payment-service',
    path: 'examples/postman-collection.json',
    name: 'postman-collection.json',
    fileType: 'postman',
    lastModified: new Date(),
    content: `{
  "info": {
    "name": "Payment Service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Payment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/v1/payments",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\\"amount\\": 1000, \\"currency\\": \\"USD\\"}"
        }
      }
    }
  ]
}`,
  },
};

// Mock messages for existing conversations
const mockConversationMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      role: 'user',
      content: 'Find all API documentation in the payment-service repository',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      conversationId: '1',
      role: 'assistant',
      content:
        'I found **12 documentation files** in the payment-service repository. Here\'s an overview of the key documents:\n\n• **api-reference.md** - Complete OpenAPI specification\n• **webhooks.md** - Webhook integration guide\n• **architecture.mmd** - System architecture diagram\n• **postman-collection.json** - Postman collection\n\nWould you like me to show you the details of any specific document?',
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      toolCalls: [
        {
          id: 'tc1',
          name: 'list_repo_docs',
          status: 'success',
          duration: 234,
        },
      ],
      documentReferences: [
        {
          repo: 'payment-service',
          path: 'docs/api-reference.md',
          title: 'API Reference',
          snippet: 'Complete API documentation for the payment service including endpoints, authentication, and examples.',
        },
        {
          repo: 'payment-service',
          path: 'docs/webhooks.md',
          title: 'Webhook Integration',
          snippet: 'Learn how to integrate webhooks for real-time payment notifications.',
        },
      ],
    },
  ],
  '2': [
    {
      id: '5',
      conversationId: '2',
      role: 'user',
      content: 'How do I set up authentication in my service?',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: '6',
      conversationId: '2',
      role: 'assistant',
      content:
        'To set up authentication in your service, you\'ll need to:\n\n1. **Install dependencies**: Add the auth-sdk package\n2. **Configure OAuth**: Set up your OAuth provider credentials\n3. **Implement middleware**: Add the auth middleware to your routes\n4. **Test**: Verify token validation is working\n\nCheck the auth-service repository for detailed implementation guides.',
      timestamp: new Date(Date.now() - 59 * 60 * 1000),
      toolCalls: [
        {
          id: 'tc3',
          name: 'search_docs',
          status: 'success',
          duration: 312,
        },
      ],
    },
  ],
};

const Index = () => {
  const { toast } = useToast();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  
  const {
    chatContext,
    setChatContext,
    selectConversation,
    selectFile,
    selectRepo,
    selectedRepo,
    selectedFile,
    selectedConversationId,
    rightPanelMode,
    setConnectionStatus,
    setRightPanelMode,
    toggleSidebar,
    toggleRightPanel,
  } = useAppStore();

  // Initialize chat hook with context
  const {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    clearMessages,
    setMessages,
    cancelGeneration,
  } = useChat({
    conversationId: selectedConversationId,
    context: chatContext,
    onDocumentReference: (repo, path) => {
      selectFile(path);
      console.log('Opening document:', repo, path);
    },
  });

  // Set chat context when a repo is selected
  useEffect(() => {
    if (selectedRepo) {
      setChatContext({
        scope: 'repo',
        repoName: selectedRepo,
      });
    }
  }, [selectedRepo, setChatContext]);

  // Load mock messages when selecting a conversation
  useEffect(() => {
    if (selectedConversationId && mockConversationMessages[selectedConversationId]) {
      setMessages(mockConversationMessages[selectedConversationId]);
    } else if (selectedConversationId) {
      clearMessages();
    }
  }, [selectedConversationId, setMessages, clearMessages]);

  // Simulate connection status (connected by default for demo)
  useEffect(() => {
    setConnectionStatus('connected');
    
    // Simulate occasional reconnection for demo
    const interval = setInterval(() => {
      // 5% chance of temporary disconnect for demo
      if (Math.random() < 0.05) {
        setConnectionStatus('reconnecting');
        toast({
          title: 'Connection interrupted',
          description: 'Attempting to reconnect...',
        });
        
        setTimeout(() => {
          setConnectionStatus('connected');
          toast({
            title: 'Connected',
            description: 'Connection restored successfully.',
          });
        }, 2000);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [setConnectionStatus, toast]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    selectConversation(null);
    setChatContext(null);
  }, [clearMessages, selectConversation, setChatContext]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleClearContext = () => {
    setChatContext(null);
  };

  const handleDocumentClick = (repo: string, path: string) => {
    selectRepo(repo);
    selectFile(path);
    setRightPanelMode('document');
  };

  const handleFileSelect = (path: string) => {
    selectFile(path);
    setRightPanelMode('document');
  };

  // Get current repository object and file tree
  const currentRepo = useMemo(() => {
    return mockRepositories.find((r) => r.name === selectedRepo);
  }, [selectedRepo]);

  const currentFileTree = useMemo(() => {
    return selectedRepo ? mockFileTree[selectedRepo] || [] : [];
  }, [selectedRepo]);

  // Get current document based on selected file
  const currentDocument = useMemo(() => {
    if (!selectedFile) return null;
    return mockDocuments[selectedFile] || null;
  }, [selectedFile]);

  const handleCloseDocument = useCallback(() => {
    selectFile(null);
    if (selectedRepo) {
      setRightPanelMode('browser');
    } else {
      setRightPanelMode('empty');
    }
  }, [selectFile, setRightPanelMode, selectedRepo]);

  const handleCopyContent = useCallback(async () => {
    if (currentDocument) {
      await navigator.clipboard.writeText(currentDocument.content);
      toast({
        title: 'Copied to clipboard',
        description: 'Document content has been copied.',
      });
    }
  }, [toast, currentDocument]);

  const handleDownload = useCallback(() => {
    if (currentDocument) {
      const blob = new Blob([currentDocument.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentDocument.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentDocument]);

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    selectRepo(null);
    selectFile(null);
    setRightPanelMode('empty');
  }, [selectRepo, selectFile, setRightPanelMode]);

  const handleNavigateRepo = useCallback(() => {
    selectFile(null);
    setRightPanelMode('browser');
  }, [selectFile, setRightPanelMode]);

  const handleSelectFileFromPalette = useCallback((repoName: string, filePath: string) => {
    selectRepo(repoName);
    selectFile(filePath);
    setRightPanelMode('document');
  }, [selectRepo, selectFile, setRightPanelMode]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: 'k',
        meta: true,
        action: () => setCommandPaletteOpen(true),
        description: 'Open command palette',
      },
      {
        key: 'k',
        ctrl: true,
        action: () => setCommandPaletteOpen(true),
        description: 'Open command palette',
      },
      {
        key: 'n',
        meta: true,
        action: handleNewChat,
        description: 'New chat',
      },
      {
        key: 'b',
        meta: true,
        action: toggleSidebar,
        description: 'Toggle sidebar',
      },
      {
        key: '\\',
        meta: true,
        action: toggleRightPanel,
        description: 'Toggle right panel',
      },
      {
        key: 'Escape',
        action: () => {
          if (selectedFile) {
            handleCloseDocument();
          }
        },
        description: 'Close document',
      },
      {
        key: '?',
        action: () => setKeyboardShortcutsOpen(true),
        description: 'Show keyboard shortcuts',
      },
    ],
  });

  // Render right panel content based on mode
  const renderRightPanelContent = () => {
    if (rightPanelMode === 'browser' && currentRepo) {
      return (
        <RepoBrowser
          repository={currentRepo}
          fileTree={currentFileTree}
          selectedPath={selectedFile}
          onSelectFile={handleFileSelect}
        />
      );
    }
    
    if (rightPanelMode === 'document') {
      return (
        <DocumentViewer
          document={currentDocument}
          onClose={handleCloseDocument}
          onCopyContent={handleCopyContent}
          onDownload={handleDownload}
        />
      );
    }

    return <RightPanelEmpty />;
  };

  return (
    <>
      <AppLayout
        organizationName="acme-corp"
        cacheItemCount={47}
        conversations={mockConversations}
        repositories={mockRepositories}
        onNewChat={handleNewChat}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenKeyboardShortcuts={() => setKeyboardShortcutsOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateRepo={handleNavigateRepo}
        mainContent={
          <ChatContainer
            messages={messages}
            context={chatContext}
            isLoading={isLoading}
            streamingMessageId={streamingMessageId}
            onSendMessage={handleSendMessage}
            onClearContext={handleClearContext}
            onDocumentClick={handleDocumentClick}
          />
        }
        rightPanelContent={renderRightPanelContent()}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        conversations={mockConversations}
        repositories={mockRepositories}
        fileTree={mockFileTree}
        onSelectConversation={selectConversation}
        onSelectRepository={selectRepo}
        onSelectFile={handleSelectFileFromPalette}
        onNewChat={handleNewChat}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={keyboardShortcutsOpen}
        onOpenChange={setKeyboardShortcutsOpen}
      />
    </>
  );
};

export default Index;
