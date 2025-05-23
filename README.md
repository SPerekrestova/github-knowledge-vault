
# GitHub Knowledge Vault

A React-based knowledge base application that aggregates and displays documentation, diagrams, and API collections from GitHub repositories within a private organization.

## Project Overview

This application provides a centralized view of documentation assets stored across multiple GitHub repositories. It supports filtering by repository and content type, with a clean interface for browsing and viewing different types of technical documentation.

## Current Functionality

- **Repository Overview**: Display all repositories with content counts
- **Content Filtering**: Filter by repository, content type (Documentation, Diagrams, API Collections), and search query
- **Content Viewing**: View markdown documentation, mermaid diagrams, and Postman collections
- **Responsive Design**: Collapsible sidebar and responsive layout
- **Refresh Functionality**: Manual refresh to pull latest data (currently mocked)

## Project Structure

### Core Components

#### `src/components/Sidebar.tsx`
- Navigation sidebar with collapsible functionality
- Repository and content type filtering
- Active state management for selected filters

#### `src/components/FilterBar.tsx`
- Top navigation bar with search and refresh functionality
- Displays current active filters (repository and content type)
- Debounced search input for performance

#### `src/components/RepoCard.tsx`
- Repository display card showing content counts
- Clickable cards for repository selection
- Badge system for different content types

#### `src/components/ContentViewer.tsx`
- Multi-format content viewer supporting:
  - Markdown documentation with basic HTML conversion
  - Mermaid diagram preview (placeholder for actual rendering)
  - Postman collection preview with JSON view tabs

### Custom Hooks

#### `src/hooks/useRepos.tsx`
- Repository data management
- Loading and error states
- Refresh functionality for repository list

#### `src/hooks/useContent.tsx`
- Content filtering and management
- Support for multiple filter combinations
- Search functionality with debouncing

### Services

#### `src/utils/githubService.ts`
- GitHub API integration layer (currently mocked)
- Content fetching and parsing logic
- Extensive TODO comments for real GitHub integration

### Pages

#### `src/pages/Index.tsx`
- Main application page
- State management for filters and selected content
- Orchestrates all components and hooks

### Types

#### `src/types/index.ts`
- TypeScript definitions for:
  - `Repository`: Repository metadata
  - `ContentItem`: Documentation content structure
  - `ContentType`: Supported content types
  - `FilterOptions`: Filter configuration

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling

## Mock Data Structure

The application currently uses mock data representing:
- 4 sample repositories (API Gateway, User Service, Payment Processing, Notification Service)
- Mixed content types across repositories
- Realistic content examples for each supported format

## Suggested Enhancements

### Immediate Priorities

1. **GitHub API Integration**
   - Replace mock data with real GitHub API calls
   - Implement authentication for private repositories
   - Add rate limiting and error handling
   - Store API credentials securely

2. **Enhanced Content Rendering**
   - Integrate Mermaid.js for actual diagram rendering
   - Improve markdown parser with syntax highlighting
   - Add better Postman collection visualization

3. **Search Improvements**
   - Full-text search across content
   - Advanced filtering options
   - Search result highlighting

### Medium-term Enhancements

4. **Caching and Performance**
   - Implement content caching strategy
   - Add background refresh capabilities
   - Optimize large content rendering

5. **User Experience**
   - Add bookmarking/favorites functionality
   - Implement content history tracking
   - Add keyboard shortcuts for navigation

6. **Content Management**
   - Support for additional file formats (PDF, images)
   - Content validation and health checks
   - Automatic content updates via webhooks

### Advanced Features

7. **Collaboration Features**
   - Comments and annotations on content
   - Content approval workflows
   - Team-specific content views

8. **Analytics and Insights**
   - Content usage analytics
   - Popular content tracking
   - Repository health metrics

9. **Integration Expansion**
   - Support for other documentation platforms
   - API documentation generation
   - Export capabilities

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Configuration

When implementing GitHub integration, you'll need to configure:

```env
GITHUB_ORGANIZATION=your-organization-name
GITHUB_TOKEN=your-github-token
GITHUB_API_BASE_URL=https://api.github.com
```

## File Organization Best Practices

The project follows React best practices:
- Components are focused and single-responsibility
- Custom hooks separate business logic from UI
- Type definitions ensure type safety
- Services abstract external API interactions

## Contributing

When adding new features:
1. Create focused, small components
2. Use TypeScript for all new code
3. Follow existing naming conventions
4. Add appropriate error handling
5. Update this README for significant changes

## Next Steps

1. Connect to GitHub API (see TODOs in `githubService.ts`)
2. Implement real-time content fetching
3. Add proper error boundaries
4. Enhance content rendering capabilities
5. Add comprehensive testing suite

