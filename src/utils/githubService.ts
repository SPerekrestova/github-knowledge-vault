import { Repository, ContentItem, ContentType } from '@/types';

// TODO: Add GitHub API integration here
// TODO: Store GitHub Personal Access Token or GitHub App credentials
// TODO: Replace mock data with actual GitHub API calls
// TODO: Add error handling for GitHub API rate limits
// TODO: Add authentication for private repositories

// GitHub API configuration - TODO: Move to environment variables
const GITHUB_CONFIG = {
  // TODO: Add your GitHub organization name
  organization: 'your-organization-name',
  // TODO: Add GitHub API base URL
  apiBaseUrl: 'https://api.github.com',
  // TODO: Add GitHub token (should be stored securely)
  token: 'your-github-token-here'
};

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
    // Enhanced Markdown content with more features
    {
      id: 'm1',
      repoId: '1',
      name: 'API Gateway Documentation',
      path: '/docs/README.md',
      type: 'markdown' as ContentType,
      content: `# API Gateway Service

This service acts as the entry point for all API requests in our microservices architecture.

## Overview

The API Gateway provides:
- **Request Routing** - Routes requests to appropriate microservices
- **Authentication** - JWT token validation
- **Rate Limiting** - Prevents API abuse
- **Request/Response Transformation** - Modifies data as needed

## Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | \`/api/v1/health\` | Health check | No |
| POST | \`/api/v1/users\` | User operations | Yes |
| POST | \`/api/v1/payments\` | Payment processing | Yes |
| GET | \`/api/v1/notifications\` | Notification service | Yes |

## Configuration

Configuration is done through environment variables:

\`\`\`bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gateway

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
\`\`\`

## Example Request

\`\`\`javascript
const response = await fetch('/api/v1/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});
\`\`\`

## Error Handling

The gateway returns standardized error responses:

\`\`\`json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided JWT token is invalid",
    "timestamp": "2023-05-15T10:30:00Z"
  }
}
\`\`\`

> **Note**: Always include proper error handling in your client applications.`,
      lastUpdated: '2023-05-15',
    },
    {
      id: 'm2',
      repoId: '2',
      name: 'User Service Guide',
      path: '/docs/guide.md',
      type: 'markdown' as ContentType,
      content: `# User Service

Handles user authentication, registration, and profile management.

## Features

- [x] JWT Authentication
- [x] Role-based access control
- [x] Password reset functionality
- [ ] Social login integration
- [ ] Two-factor authentication

## API Reference

### Authentication

\`\`\`typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}
\`\`\`

### Endpoints

- \`POST /users/register\` - Register new user
- \`POST /users/login\` - User authentication  
- \`GET /users/profile\` - Get user profile
- \`PUT /users/profile\` - Update user profile`,
      lastUpdated: '2023-06-20',
    },
    
    // Complex Mermaid diagrams
    {
      id: 'd1',
      repoId: '1',
      name: 'API Gateway Architecture',
      path: '/docs/architecture.mmd',
      type: 'mermaid' as ContentType,
      content: `graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile App]
        API_CLIENT[API Client]
    end
    
    subgraph "Gateway Layer"
        LB[Load Balancer]
        GATEWAY[API Gateway]
        AUTH[Auth Service]
        RATE[Rate Limiter]
    end
    
    subgraph "Service Layer"
        USER[User Service]
        PAYMENT[Payment Service]
        NOTIFICATION[Notification Service]
        ORDER[Order Service]
    end
    
    subgraph "Data Layer"
        USER_DB[(User DB)]
        PAYMENT_DB[(Payment DB)]
        NOTIFICATION_DB[(Notification DB)]
        CACHE[(Redis Cache)]
    end
    
    WEB --> LB
    MOBILE --> LB
    API_CLIENT --> LB
    
    LB --> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> RATE
    
    GATEWAY --> USER
    GATEWAY --> PAYMENT
    GATEWAY --> NOTIFICATION
    GATEWAY --> ORDER
    
    USER --> USER_DB
    PAYMENT --> PAYMENT_DB
    NOTIFICATION --> NOTIFICATION_DB
    
    AUTH --> CACHE
    RATE --> CACHE
    
    classDef client fill:#e1f5fe
    classDef gateway fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef data fill:#fff3e0
    
    class WEB,MOBILE,API_CLIENT client
    class LB,GATEWAY,AUTH,RATE gateway
    class USER,PAYMENT,NOTIFICATION,ORDER service
    class USER_DB,PAYMENT_DB,NOTIFICATION_DB,CACHE data`,
      lastUpdated: '2023-05-18',
    },
    {
      id: 'd2',
      repoId: '2',
      name: 'Authentication Flow',
      path: '/docs/auth-flow.mmd',
      type: 'mermaid' as ContentType,
      content: `sequenceDiagram
    participant U as User
    participant C as Client App
    participant G as API Gateway
    participant A as Auth Service
    participant DB as Database
    participant R as Redis Cache
    
    Note over U,R: User Login Flow
    
    U->>C: Enter credentials
    C->>G: POST /auth/login
    G->>A: Validate credentials
    A->>DB: Check user exists
    DB-->>A: User data
    
    alt Valid credentials
        A->>A: Generate JWT token
        A->>R: Cache user session
        A-->>G: Return token + user data
        G-->>C: 200 OK with token
        C-->>U: Login successful
    else Invalid credentials
        A-->>G: 401 Unauthorized
        G-->>C: 401 Unauthorized
        C-->>U: Login failed
    end
    
    Note over U,R: Subsequent API Calls
    
    U->>C: Make API request
    C->>G: API call with Bearer token
    G->>A: Validate token
    A->>R: Check cached session
    
    alt Valid token
        R-->>A: Session valid
        A-->>G: Token valid
        G->>G: Process request
        G-->>C: API response
        C-->>U: Show result
    else Invalid/Expired token
        R-->>A: Session invalid/expired
        A-->>G: 401 Unauthorized
        G-->>C: 401 Unauthorized
        C->>C: Redirect to login
        C-->>U: Please login again
    end`,
      lastUpdated: '2023-06-25',
    },
    {
      id: 'd3',
      repoId: '3',
      name: 'Payment Processing Flow',
      path: '/docs/payment-flow.mmd',
      type: 'mermaid' as ContentType,
      content: `stateDiagram-v2
    [*] --> Pending: Payment initiated
    
    Pending --> Validating: Validate payment data
    Validating --> Processing: Data valid
    Validating --> Failed: Invalid data
    
    Processing --> Authorizing: Send to payment gateway
    Authorizing --> Authorized: Payment authorized
    Authorizing --> Declined: Payment declined
    Authorizing --> Failed: Gateway error
    
    Authorized --> Capturing: Capture payment
    Capturing --> Completed: Payment captured
    Capturing --> Failed: Capture failed
    
    Completed --> [*]
    Failed --> [*]
    Declined --> [*]
    
    Failed --> Pending: Retry payment
    Declined --> Pending: Retry with different method`,
      lastUpdated: '2023-07-12',
    },

    // Comprehensive Postman collections
    {
      id: 'p1',
      repoId: '1',
      name: 'API Gateway Collection',
      path: '/docs/gateway.postman.json',
      type: 'postman' as ContentType,
      content: `{
  "info": {
    "name": "API Gateway Collection",
    "description": "Complete collection of API Gateway endpoints for testing and development",
    "version": "2.1.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health",
        "description": "Check if the API Gateway is running and healthy"
      }
    },
    {
      "name": "User Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\\n  \\"email\\": \\"user@example.com\\",\\n  \\"password\\": \\"password123\\"\\n}"
            },
            "description": "Authenticate user and receive JWT token"
          }
        },
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/users/profile",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "description": "Get current user profile information"
          }
        }
      ]
    },
    {
      "name": "Route Management",
      "item": [
        {
          "name": "Get All Routes",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/routes",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "description": "Get list of all available routes in the gateway"
          }
        },
        {
          "name": "Get Route Health",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/routes/health",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "description": "Check health status of all downstream services"
          }
        }
      ]
    }
  ]
}`,
      lastUpdated: '2023-05-20',
    },
    {
      id: 'p2',
      repoId: '2',
      name: 'User Management API',
      path: '/docs/user-api.postman.json',
      type: 'postman' as ContentType,
      content: `{
  "info": {
    "name": "User Management API",
    "description": "Comprehensive user management API for registration, authentication, and profile management",
    "version": "1.2.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com/users",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    },
    {
      "key": "userId",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/register",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\\n  \\"name\\": \\"John Doe\\",\\n  \\"email\\": \\"john@example.com\\",\\n  \\"password\\": \\"securePassword123\\",\\n  \\"role\\": \\"user\\"\\n}"
            },
            "description": "Register a new user account"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\\n  \\"email\\": \\"john@example.com\\",\\n  \\"password\\": \\"securePassword123\\"\\n}"
            },
            "description": "Authenticate user and receive access token"
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/refresh",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "description": "Refresh the user's access token"
          }
        }
      ]
    },
    {
      "name": "Profile Management",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/profile",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "description": "Get current user's profile information"
          }
        },
        {
          "name": "Update Profile",
          "request": {
            "method": "PUT",
            "url": "{{baseUrl}}/profile",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\\n  \\"name\\": \\"John Updated\\",\\n  \\"email\\": \\"john.updated@example.com\\"\\n}"
            },
            "description": "Update user profile information"
          }
        },
        {
          "name": "Change Password",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/change-password",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\\n  \\"currentPassword\\": \\"oldPassword123\\",\\n  \\"newPassword\\": \\"newSecurePassword456\\"\\n}"
            },
            "description": "Change user password"
          }
        }
      ]
    },
    {
      "name": "Admin Operations",
      "item": [
        {
          "name": "List All Users",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/admin/users",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "description": "Get list of all users (admin only)"
          }
        },
        {
          "name": "Get User by ID",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/admin/users/{{userId}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "description": "Get specific user by ID (admin only)"
          }
        },
        {
          "name": "Delete User",
          "request": {
            "method": "DELETE",
            "url": "{{baseUrl}}/admin/users/{{userId}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "description": "Delete user account (admin only)"
          }
        }
      ]
    }
  ]
}`,
      lastUpdated: '2023-06-30',
    },
    {
      id: 'p3',
      repoId: '3',
      name: 'Payment API Collection',
      path: '/docs/payment-api.postman.json',
      type: 'postman' as ContentType,
      content: `{
  "info": {
    "name": "Payment Processing API",
    "description": "Payment processing endpoints for handling transactions, refunds, and payment methods",
    "version": "1.0.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com/payments",
      "type": "string"
    },
    {
      "key": "apiKey",
      "value": "your-api-key-here",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Process Payment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/process",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\\n  \\"amount\\": 2999,\\n  \\"currency\\": \\"USD\\",\\n  \\"paymentMethod\\": {\\n    \\"type\\": \\"credit_card\\",\\n    \\"cardNumber\\": \\"4111111111111111\\",\\n    \\"expiryMonth\\": 12,\\n    \\"expiryYear\\": 2025,\\n    \\"cvv\\": \\"123\\"\\n  },\\n  \\"customer\\": {\\n    \\"email\\": \\"customer@example.com\\",\\n    \\"name\\": \\"John Doe\\"\\n  }\\n}"
        },
        "description": "Process a payment transaction"
      }
    },
    {
      "name": "Get Payment Status",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/status/{{paymentId}}",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          }
        ],
        "description": "Get the status of a payment transaction"
      }
    },
    {
      "name": "Refund Payment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/refund",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\\n  \\"paymentId\\": \\"payment_12345\\",\\n  \\"amount\\": 2999,\\n  \\"reason\\": \\"Customer requested refund\\"\\n}"
        },
        "description": "Process a refund for a payment"
      }
    }
  ]
}`,
      lastUpdated: '2023-07-15',
    }
  ],

  // TODO: Implement real GitHub API calls
  // TODO: Add function to fetch repositories from GitHub organization
  // Example: GET /orgs/{org}/repos
  getRepositories: async (): Promise<Repository[]> => {
    // TODO: Replace with actual GitHub API call
    // const response = await fetch(`${GITHUB_CONFIG.apiBaseUrl}/orgs/${GITHUB_CONFIG.organization}/repos`, {
    //   headers: {
    //     'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
    //     'Accept': 'application/vnd.github.v3+json'
    //   }
    // });
    // const repos = await response.json();
    // TODO: Filter repos that have docs folder
    // TODO: Transform GitHub repo data to Repository type
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Refreshing repositories from GitHub...');
        resolve(githubService.mockRepositories);
      }, 800);
    });
  },

  // TODO: Implement function to check if repo has docs folder
  // Example: GET /repos/{owner}/{repo}/contents/docs
  checkDocsFolderExists: async (repoName: string): Promise<boolean> => {
    // TODO: Check if docs folder exists in repository
    return true;
  },

  // TODO: Implement function to fetch content from docs folder
  // Example: GET /repos/{owner}/{repo}/contents/docs
  getRepoContent: async (repoId: string): Promise<ContentItem[]> => {
    // TODO: Get repository name from repoId
    // TODO: Fetch docs folder contents from GitHub
    // TODO: Parse markdown files (.md)
    // TODO: Parse mermaid diagrams (.mmd)
    // TODO: Parse postman collections (.json)
    // TODO: Transform GitHub file data to ContentItem type
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Refreshing content for repo ${repoId} from GitHub...`);
        const filteredContent = githubService.mockContent.filter(item => item.repoId === repoId);
        resolve(filteredContent);
      }, 600);
    });
  },

  // Get all content across all repositories
  getAllContent: async (): Promise<ContentItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Refreshing all content from GitHub...');
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
  },

  // TODO: Add refresh functionality to clear cache and fetch fresh data
  refreshAllData: async (): Promise<void> => {
    // TODO: Clear any cached data
    // TODO: Fetch fresh repositories
    // TODO: Fetch fresh content for all repositories
    console.log('Refreshing all data from GitHub...');
  }
};
