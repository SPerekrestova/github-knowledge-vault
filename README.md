# GitHub Knowledge Vault

A React + TypeScript knowledge base app that aggregates and displays documentation, diagrams, and API collections from GitHub repositories (organization or user).


![Demo of the app](./assets/demo.gif)

## Features

- **Repository Overview:** Lists all repositories with a `/doc` folder
- **Content Filtering:** Filter by repository, content type (Markdown, Mermaid, Postman), and search query
- **Content Viewing:** Renders Markdown docs, Mermaid diagrams, and Postman collections
- **Responsive UI:** Collapsible sidebar, filter bar, and content grid
- **Manual Refresh:** Reloads data from GitHub (no caching yet)

## User Flow

1. See a list of repositories with documentation
2. Filter by repository, content type, or search
3. Click a repository or content type to update the content grid
4. Click a content item to open a detailed viewer
5. Refresh data or reset filters at any time

## Supported Repositories

- **Works with:**
  - Any GitHub organization or user (private or public) with repositories containing a `/doc` folder
  - Supported file types in `/doc`:
    - Markdown files (`.md`)
    - Mermaid diagrams (`.mmd`, `.mermaid`)
    - Postman collections (`postman*.json`)
    - SVG pictures (`.svg`)
    - OpenAPI files (`.yml`)
- **Integration:**
  - Only GitHub is supported out of the box
  - No direct integration with other platforms (but code is extensible)

## Setup & Local Development

1. **Clone the repository**
2. **Configure environment variables** (see below)
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the project root with the following:

```
VITE_GITHUB_OWNER=your-github-org-or-username
VITE_GITHUB_OWNER_TYPE=org # or 'user'
VITE_GITHUB_API_BASE_URL=https://api.github.com
VITE_GITHUB_TOKEN=your-github-token
```

- `VITE_GITHUB_OWNER`: GitHub organization or username
- `VITE_GITHUB_OWNER_TYPE`: `org` or `user`
- `VITE_GITHUB_API_BASE_URL`: GitHub API base URL (default: `https://api.github.com`)
- `VITE_GITHUB_TOKEN`: GitHub personal access token (required for private repos)

## Technology Stack

- React 18 + TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide React
- Vite

---

**This project is designed to work with any GitHub repository structure as long as documentation assets are placed in a `/doc` folder.**

For questions or issues, please open an issue or pull request.

