
import { Repository, ContentItem, ContentType } from '@/types';

// This is a mock service. In a real implementation, you would connect to GitHub API
export const githubService = {
  // Mock data for demo purposes
  mockRepositories: [
    {
      id: '1',
      name: 'API Gateway',
      description: 'Gateway service for all external API requests',
      url: 'https://github.com/organization/api-gateway',
      hasDocFolder: true,
    },
    {
      id: '2',
      name: 'User Service',
      description: 'User management microservice',
      url: 'https://github.com/organization/user-service',
      hasDocFolder: true,
    },
    {
      id: '3',
      name: 'Payment Processing',
      description: 'Payment processing service',
      url: 'https://github.com/organization/payment-processing',
      hasDocFolder: true,
    },
    {
      id: '4',
      name: 'Notification Service',
      description: 'Service for sending notifications',
      url: 'https://github.com/organization/notification-service',
      hasDocFolder: true,
    }
  ],

  mockContent: [
    // Markdown content
    {
      id: 'm1',
      repoId: '1',
      name: 'API Gateway Documentation',
      path: '/docs/README.md',
      type: 'markdown' as ContentType,
      content: '# API Gateway\n\nThis service acts as the entry point for all API requests.\n\n## Endpoints\n\n- `/api/v1/users` - User management\n- `/api/v1/payments` - Payment processing\n\n## Configuration\n\nConfiguration is done through environment variables.',
      lastUpdated: '2023-05-15',
    },
    {
      id: 'm2',
      repoId: '2',
      name: 'User Service Guide',
      path: '/docs/guide.md',
      type: 'markdown' as ContentType,
      content: '# User Service\n\nHandles user authentication, registration, and profile management.\n\n## Features\n\n- JWT Authentication\n- Role-based access control\n- Password reset functionality\n\n## API\n\n- `POST /users/register`\n- `POST /users/login`\n- `GET /users/profile`',
      lastUpdated: '2023-06-20',
    },
    {
      id: 'm3',
      repoId: '3',
      name: 'Payment Integration',
      path: '/docs/integration.md',
      type: 'markdown' as ContentType,
      content: '# Payment Integration\n\nGuide to integrating with the payment service.\n\n## Supported Payment Methods\n\n- Credit Cards\n- PayPal\n- Bank Transfers\n\n## Webhooks\n\nPayment events are sent to configured webhook endpoints.',
      lastUpdated: '2023-07-10',
    },
    // Mermaid diagrams
    {
      id: 'd1',
      repoId: '1',
      name: 'API Flow Diagram',
      path: '/docs/flow.mmd',
      type: 'mermaid' as ContentType,
      content: 'graph TD\n    A[Client] -->|Request| B(API Gateway)\n    B --> C{Route Request}\n    C -->|Users| D[User Service]\n    C -->|Payments| E[Payment Service]\n    C -->|Notifications| F[Notification Service]',
      lastUpdated: '2023-05-18',
    },
    {
      id: 'd2',
      repoId: '2',
      name: 'Authentication Sequence',
      path: '/docs/auth-flow.mmd',
      type: 'mermaid' as ContentType,
      content: 'sequenceDiagram\n    participant User\n    participant API\n    participant Auth\n    participant Database\n    User->>API: Login Request\n    API->>Auth: Validate Credentials\n    Auth->>Database: Check User\n    Database-->>Auth: User Data\n    Auth-->>API: Auth Token\n    API-->>User: Response with Token',
      lastUpdated: '2023-06-25',
    },
    // Postman collections
    {
      id: 'p1',
      repoId: '1',
      name: 'API Gateway Collection',
      path: '/docs/gateway.postman.json',
      type: 'postman' as ContentType,
      content: '{\n  "info": {\n    "name": "API Gateway Collection",\n    "description": "Collection of API Gateway endpoints",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [\n    {\n      "name": "Get Routes",\n      "request": {\n        "method": "GET",\n        "url": "{{baseUrl}}/routes"\n      }\n    }\n  ]\n}',
      lastUpdated: '2023-05-20',
    },
    {
      id: 'p2',
      repoId: '2',
      name: 'User API Collection',
      path: '/docs/user-api.postman.json',
      type: 'postman' as ContentType,
      content: '{\n  "info": {\n    "name": "User API Collection",\n    "description": "User management API endpoints",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [\n    {\n      "name": "Register User",\n      "request": {\n        "method": "POST",\n        "url": "{{baseUrl}}/users/register"\n      }\n    },\n    {\n      "name": "Login",\n      "request": {\n        "method": "POST",\n        "url": "{{baseUrl}}/users/login"\n      }\n    }\n  ]\n}',
      lastUpdated: '2023-06-30',
    },
  ],

  // Get repositories
  getRepositories: async (): Promise<Repository[]> => {
    // In a real implementation, this would fetch from GitHub API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(githubService.mockRepositories);
      }, 800);
    });
  },

  // Get content for a specific repository
  getRepoContent: async (repoId: string): Promise<ContentItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredContent = githubService.mockContent.filter(item => item.repoId === repoId);
        resolve(filteredContent);
      }, 600);
    });
  },

  // Get all content across all repositories
  getAllContent: async (): Promise<ContentItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(githubService.mockContent);
      }, 800);
    });
  },

  // Get content by type
  getContentByType: async (contentType: ContentType): Promise<ContentItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredContent = githubService.mockContent.filter(item => item.type === contentType);
        resolve(filteredContent);
      }, 600);
    });
  },

  // Get a specific content item by id
  getContentById: async (contentId: string): Promise<ContentItem | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundContent = githubService.mockContent.find(item => item.id === contentId) || null;
        resolve(foundContent);
      }, 400);
    });
  }
};
