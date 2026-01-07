# Cozy UI Foundation

A modern documentation browser and AI chat interface for exploring repositories and technical documentation.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Visit **http://localhost:8080** 🚀

## What is this?

A React-based application that provides:

- 📚 **Documentation Browser** - Navigate repositories and view files
- 💬 **AI Chat Interface** - Ask questions about your documentation
- 📄 **Multi-format Viewer** - Markdown, YAML, JSON, OpenAPI, Postman collections
- ⌨️ **Command Palette** - Quick navigation with `Cmd+K`
- 🔄 **Real-time Updates** - WebSocket streaming for live responses

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- shadcn/ui + Tailwind CSS
- Zustand (state management)
- React Query (data fetching)
- WebSocket support

## Available Commands

```bash
bun run dev        # Start dev server
bun run build      # Build for production
bun run preview    # Preview production build
bun run lint       # Run linter
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Command palette |
| `Cmd + N` | New chat |
| `Cmd + B` | Toggle sidebar |
| `Cmd + \` | Toggle right panel |
| `?` | Show all shortcuts |

## Configuration

Copy `.env.example` to `.env` to configure:

- Backend API URL (default: `http://localhost:3001`)
- WebSocket URL (default: `ws://localhost:3001`)
- Health check intervals
- Reconnection settings

## Documentation

📖 See **[CLAUDE.md](./CLAUDE.md)** for comprehensive documentation including:
- Architecture details
- Component structure
- API integration guide
- Development best practices
- Troubleshooting

## Development

Currently running with **mock data**. To connect a real backend:

1. Set up API server at `http://localhost:3001`
2. Update environment variables in `.env`
3. See [CLAUDE.md](./CLAUDE.md) for required API endpoints

## Project Structure

```
src/
├── components/     # React components (layout, chat, viewer, etc.)
├── services/       # API client, WebSocket, chat service
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── types/          # TypeScript definitions
└── pages/          # Route pages
```

---

**Built with** ❤️ **on the Lovable platform**
