# Cozy UI Foundation - Project Documentation

## Overview

**Cozy UI Foundation** is a sophisticated documentation browser and AI chat interface application built on the Lovable platform. It provides an intuitive interface for browsing repository documentation, chatting with an AI assistant, and viewing various document types in a modern three-panel layout.

**Current Status:** ✅ Fully functional in development mode with mock data

## Project Capabilities

### Core Features

1. **Documentation Repository Browser**
   - Navigate through multiple code repositories
   - Browse file trees with folder/file hierarchy
   - Support for multiple repository types

2. **AI Chat Interface**
   - Interactive chat with AI assistant
   - Context-aware conversations (global or repo-scoped)
   - Streaming responses via WebSocket
   - Tool call visualization
   - Document reference linking

3. **Multi-Format Document Viewer**
   - Markdown rendering with syntax highlighting
   - YAML/JSON viewers
   - OpenAPI specification viewer
   - Postman collection viewer
   - Mermaid diagram support
   - Code syntax highlighting

4. **Conversation Management**
   - Multiple concurrent conversations
   - Conversation history
   - Context switching
   - Message search and filtering

5. **Advanced Navigation**
   - Command Palette (Cmd/Ctrl+K)
   - Keyboard shortcuts
   - Breadcrumb navigation
   - Quick file search

6. **Real-time Features**
   - WebSocket connection for live updates
   - Automatic reconnection with exponential backoff
   - Connection status monitoring
   - Health check system

## Technology Stack

### Frontend Framework
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.8** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool and dev server

### UI Components & Styling
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management (dark mode support)

### State Management
- **Zustand 5.0** - Lightweight, modern state management
- **@tanstack/react-query 5.83** - Powerful server state management

### Routing & Navigation
- **React Router 6.30** - Declarative routing for React

### Forms & Validation
- **React Hook Form 7.61** - Performant form handling
- **Zod 3.25** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation schema integration

### Markdown & Code Rendering
- **react-markdown 10.1** - Markdown component
- **react-syntax-highlighter 16.1** - Code syntax highlighting
- **react-day-picker** - Date picker component

### Data Visualization
- **recharts 2.15** - Composable charting library
- **embla-carousel-react** - Lightweight carousel

### UI Enhancements
- **cmdk** - Command palette component
- **sonner** - Toast notifications
- **react-resizable-panels** - Resizable panel layouts
- **vaul** - Drawer component
- **input-otp** - OTP input component

### Utilities
- **date-fns 3.6** - Modern date utility library
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes
- **class-variance-authority** - Component variant management

### Development Tools
- **ESLint 9.32** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS transformation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Sidebar   │  │ Chat Panel   │  │  Right Panel     │   │
│  │             │  │              │  │  - Doc Viewer    │   │
│  │ - Convos    │  │ - Messages   │  │  - Repo Browser  │   │
│  │ - Repos     │  │ - Input      │  │                  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            State Management (Zustand)                │   │
│  │  - App State  - UI State  - Connection Status       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Services Layer                          │   │
│  │  - API Client  - Chat Service  - WebSocket Client   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Expected)                    │
│  - REST API (http://localhost:3001)                         │
│  - WebSocket (ws://localhost:3001)                          │
│  - Endpoints: /health, /api/repos, /api/conversations       │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
cozy-ui-foundation/
├── src/
│   ├── components/          # React components
│   │   ├── layout/         # Layout components
│   │   │   ├── AppLayout.tsx      # Main three-panel layout
│   │   │   ├── Header.tsx         # Top header
│   │   │   ├── Sidebar.tsx        # Left sidebar
│   │   │   ├── MainPanel.tsx      # Center chat panel
│   │   │   └── RightPanel.tsx     # Right document/browser panel
│   │   ├── chat/           # Chat interface
│   │   │   ├── ChatContainer.tsx  # Chat message container
│   │   │   ├── ChatInput.tsx      # Message input
│   │   │   └── ToolCallBadge.tsx  # Tool usage indicator
│   │   ├── viewer/         # Document viewers
│   │   │   ├── DocumentViewer.tsx # Main document viewer
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── CodeBlock.tsx      # Code highlighting
│   │   │   ├── DocumentHeader.tsx
│   │   │   └── DocumentTabs.tsx
│   │   ├── browser/        # Repository browser
│   │   │   └── RepoBrowser.tsx    # File tree browser
│   │   ├── navigation/     # Navigation components
│   │   │   ├── CommandPalette.tsx # Cmd+K palette
│   │   │   ├── Breadcrumbs.tsx    # Navigation breadcrumbs
│   │   │   └── KeyboardShortcutsHelp.tsx
│   │   ├── sidebar/        # Sidebar components
│   │   ├── common/         # Shared components
│   │   │   ├── StartupCheck.tsx   # Health check on startup
│   │   │   └── RightPanelEmpty.tsx
│   │   └── ui/             # shadcn/ui components (40+ components)
│   │
│   ├── services/           # Business logic & API
│   │   ├── apiClient.ts    # HTTP client with fetch wrapper
│   │   ├── chatService.ts  # Chat & streaming logic
│   │   ├── healthService.ts # Health check service
│   │   └── websocketClient.ts # WebSocket management
│   │
│   ├── stores/             # State management
│   │   └── appStore.ts     # Zustand global state
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useChat.ts      # Chat functionality
│   │   ├── useWebSocket.ts # WebSocket connection
│   │   ├── useHealth.ts    # Health monitoring
│   │   ├── useConnectionStatus.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── use-mobile.tsx  # Mobile detection
│   │   └── use-toast.ts    # Toast notifications
│   │
│   ├── types/              # TypeScript definitions
│   │   ├── index.ts        # Core types
│   │   └── connection.ts   # Connection-related types
│   │
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Main application page
│   │   └── NotFound.tsx    # 404 page
│   │
│   ├── lib/                # Utilities
│   │   └── utils.ts        # Helper functions
│   │
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── components.json        # shadcn/ui configuration
└── README.md              # Project README
```

### Key Architecture Patterns

#### 1. Component Organization
- **Atomic Design**: Components organized by complexity (layout, features, ui)
- **Colocation**: Related components grouped by feature
- **Separation of Concerns**: UI components vs. logic hooks vs. services

#### 2. State Management Strategy
- **Zustand Store** (`appStore.ts`): Global UI state, selections, connection status
- **React Query**: Server data fetching, caching, and synchronization
- **Local State**: Component-specific state with useState
- **Custom Hooks**: Reusable stateful logic

#### 3. Data Flow
```
User Action
    ↓
Component Event Handler
    ↓
Hook (useChat, useWebSocket, etc.)
    ↓
Service Layer (apiClient, chatService)
    ↓
Backend API / WebSocket
    ↓
State Update (Zustand / React Query)
    ↓
Component Re-render
```

#### 4. API Layer (`services/apiClient.ts`)
- Centralized HTTP client with timeout and error handling
- RESTful endpoints for repos, conversations, search
- Health check monitoring
- Configurable base URL via environment variables

#### 5. WebSocket Integration (`services/websocketClient.ts`)
- Real-time chat message streaming
- Automatic reconnection with exponential backoff
- Heartbeat/ping-pong for connection monitoring
- Event-based message handling

#### 6. Type Safety
- Comprehensive TypeScript types in `types/`
- Zod schemas for runtime validation
- Type-safe API responses
- Strict TypeScript configuration

## How to Run the Project

### Prerequisites

- **Node.js**: v18.0.0 or higher (tested with v22.21.1)
- **npm**: v8.0.0 or higher (tested with v10.9.4)
- **Git**: For version control

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cozy-ui-foundation
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

   This will install all 467 packages required for the project.

3. **Configure environment variables** (optional)
   ```bash
   cp .env.example .env
   ```

   Edit `.env` to configure backend API URLs if needed.

4. **Start the development server**
   ```bash
   bun run dev
   ```

   The application will be available at:
   - **Local**: http://localhost:8080/
   - **Network**: http://<your-ip>:8080/

### Available Scripts

```bash
# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Build for development (with source maps)
bun run build:dev

# Preview production build
bun run preview

# Run linter
bun run lint
```

### Development Server Features

- **Hot Module Replacement (HMR)**: Instant updates without page reload
- **Fast Refresh**: Preserves React component state during updates
- **TypeScript Checking**: Real-time type checking
- **Port**: Default 8080 (configurable in `vite.config.ts`)

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Health Check Settings
VITE_HEALTH_CHECK_INTERVAL=30000
VITE_HEALTH_CHECK_TIMEOUT=5000

# WebSocket Settings
VITE_WS_RECONNECT=true
VITE_WS_MAX_RECONNECT_ATTEMPTS=5
VITE_WS_RECONNECT_INTERVAL=1000
VITE_WS_MAX_RECONNECT_INTERVAL=30000
VITE_WS_HEARTBEAT_INTERVAL=30000

# API Settings
VITE_API_TIMEOUT=10000
```

### Backend API Requirements

The frontend expects a backend API with the following endpoints:

#### Health Check
```
GET /health
Response: { status: 'ok', timestamp: '...' }
```

#### Repository Endpoints
```
GET /api/repos
GET /api/repos/:name
GET /api/repos/:name/tree
GET /api/repos/:name/files/:path
```

#### Conversation Endpoints
```
GET /api/conversations
POST /api/conversations
GET /api/conversations/:id
DELETE /api/conversations/:id
GET /api/conversations/:id/messages
```

#### Search Endpoint
```
GET /api/search?q=query&repo=repo-name
```

#### WebSocket Endpoint
```
WS ws://localhost:3001
Messages: { type: 'text' | 'tool_use_start' | 'tool_result' | 'done' }
```

## Key Features in Detail

### 1. Command Palette

Access with `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

Features:
- Quick navigation to conversations
- Repository search
- File search across all repos
- Command execution
- Fuzzy search

### 2. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd + N` | New chat |
| `Cmd + B` | Toggle sidebar |
| `Cmd + \` | Toggle right panel |
| `Escape` | Close current document |
| `?` | Show keyboard shortcuts help |

### 3. Chat Context System

Chat conversations can have two scopes:

- **Global Scope**: Search across all repositories
- **Repository Scope**: Limited to a specific repository

Context is automatically set when selecting a repository.

### 4. Document References

AI responses can include clickable document references that:
- Show document snippets
- Navigate to full document on click
- Display in the right panel

### 5. Tool Call Visualization

When the AI uses tools (search, file access, etc.), you'll see:
- Tool name and status (pending/running/success/error)
- Execution duration
- Visual badge indicators

### 6. Connection Status

Real-time connection status indicator shows:
- **Connected**: Green indicator, full functionality
- **Reconnecting**: Yellow indicator, attempting reconnection
- **Disconnected**: Red indicator, no backend connection

## Current Implementation Status

### ✅ Fully Implemented (with Mock Data)

- Three-panel layout (sidebar, chat, document viewer)
- Chat interface with streaming responses
- Document viewer with multiple format support
- Repository browser with file tree
- Command palette and keyboard shortcuts
- State management with Zustand
- WebSocket client with auto-reconnect
- Health check system
- Responsive design
- Dark mode support (via next-themes)
- Toast notifications

### 🔄 Using Mock Data

The following features currently use mock data in `src/pages/Index.tsx`:

- **Conversations**: `mockConversations` (lines 16-51)
- **Repositories**: `mockRepositories` (lines 54-87)
- **File Trees**: `mockFileTree` (lines 90-148)
- **Documents**: `mockDocuments` (lines 151-371)
- **Messages**: `mockConversationMessages` (lines 374-439)

### 🚧 Ready for Backend Integration

The API client is fully implemented and ready to connect to a real backend:

- API endpoints defined in `src/services/apiClient.ts`
- WebSocket client in `src/services/websocketClient.ts`
- Health check service in `src/services/healthService.ts`

To integrate a real backend:
1. Set up backend API at `http://localhost:3001`
2. Implement the required endpoints
3. Replace mock data calls in `Index.tsx` with API calls
4. Update `chatService.ts` to use real WebSocket streaming

## Development Notes

### TypeScript Configuration

The project uses strict TypeScript settings:
- Strict mode enabled
- No implicit any
- Strict null checks
- No unused locals/parameters

### Code Style

- **ESLint**: Configured with React and TypeScript rules
- **Component Style**: Functional components with hooks
- **Import Aliases**: `@/` maps to `src/` directory
- **Naming**: PascalCase for components, camelCase for functions

### Adding New Components

1. **UI Components** (shadcn/ui):
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```

2. **Custom Components**:
   - Place in appropriate `src/components/` subdirectory
   - Export from index file if needed
   - Add types to `src/types/`

### State Management Best Practices

1. **Use Zustand** for global UI state (sidebar collapsed, selections, etc.)
2. **Use React Query** for server data (conversations, repositories)
3. **Use local useState** for component-specific UI state
4. **Create custom hooks** for reusable stateful logic

### Performance Considerations

- Components use `useMemo` and `useCallback` for expensive computations
- React Query provides automatic caching and deduplication
- Virtualization ready for large file lists (via react-window)
- Code splitting with React.lazy (if needed)

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, Vite will automatically try the next available port. You can also specify a custom port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000, // Your preferred port
  },
});
```

### Backend Connection Issues

1. Verify backend is running at `http://localhost:3001`
2. Check CORS configuration on backend
3. Review browser console for network errors
4. Check environment variables in `.env`

### WebSocket Connection Failures

1. Ensure WebSocket server is running at `ws://localhost:3001`
2. Check browser console for WebSocket errors
3. Verify firewall settings
4. Review WebSocket reconnection settings in `.env`

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
bun install

# Clear Vite cache
rm -rf node_modules/.vite
bun run dev
```

## Security Notes

### Current Vulnerabilities

The project has 4 bun vulnerabilities (3 moderate, 1 high). To address:

```bash
bun audit
bun audit fix
```

### Production Considerations

Before deploying to production:

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use secure environment variables for sensitive data
3. **HTTPS**: Use HTTPS for production deployments
4. **CSP**: Configure Content Security Policy headers
5. **Dependencies**: Regularly update dependencies with `bun update`

## Additional Resources

- **Lovable Platform**: https://lovable.dev
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Radix UI Docs**: https://www.radix-ui.com
- **Tailwind CSS Docs**: https://tailwindcss.com
- **React Router Docs**: https://reactrouter.com
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **React Query Docs**: https://tanstack.com/query

## License

This project is built on the Lovable platform. Check with your organization for licensing details.

---

**Last Updated**: 2026-01-03
**Version**: 0.0.0
**Node Version**: v22.21.1
**bun Version**: 10.9.4
