# GitHub Actions Workflows

This directory contains CI/CD workflows for the GitHub Knowledge Vault project.

## Workflows

### 1. MCP Bridge Tests (`mcp-bridge.yml`)

Tests the Python MCP Bridge backend.

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches (when bridge files change)
- Pull requests to `main` or `develop` (when bridge files change)

**Jobs:**

- **test**: Run tests on Python 3.10, 3.11, and 3.12
  - Installs dependencies
  - Runs linting (flake8, black, mypy)
  - Compiles all Python files
  - Runs pytest
  - Generates coverage report (Python 3.11 only)

- **lint**: Additional linting and security checks
  - pylint for code quality
  - bandit for security vulnerabilities
  - safety for dependency vulnerabilities

- **build**: Validates the build
  - Checks requirements.txt
  - Tests imports
  - Verifies compilation
  - Validates configuration files

- **integration**: Mock integration test
  - Creates mock MCP Server
  - Tests API startup
  - Validates health endpoint

**Environment Variables:**
- `GITHUB_ORGANIZATION`: Test organization name
- `GITHUB_TOKEN`: GitHub token (from secrets)
- `MCP_SERVER_PATH`: Path to mock MCP Server
- `CACHE_ENABLED`: Cache configuration

### 2. Frontend Tests (`frontend.yml`)

Tests the React TypeScript frontend.

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches (when frontend files change)
- Pull requests to `main` or `develop` (when frontend files change)

**Jobs:**

- **test**: Run tests on Node.js 18 and 20
  - Installs dependencies
  - Runs ESLint
  - Type checks with TypeScript
  - Runs Vitest tests
  - Generates coverage report (Node 20 only)

- **build**: Production build
  - Builds with Vite
  - Validates build output
  - Uploads build artifacts

- **lint**: Code quality checks
  - ESLint for code quality
  - Prettier for formatting (if configured)

**Environment Variables:**
- `VITE_GITHUB_OWNER`: Test organization name
- `VITE_GITHUB_OWNER_TYPE`: Organization type
- `VITE_GITHUB_TOKEN`: GitHub token (from secrets)

### 3. Integration Tests (`integration.yml`)

Tests the entire stack (Frontend + MCP Bridge + Mock MCP Server).

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**

- **integration**: Full stack test
  - Sets up Python and Node.js
  - Creates mock MCP Server
  - Starts MCP Bridge
  - Tests all API endpoints
  - Tests cache functionality
  - Builds frontend
  - Generates test summary

**What it tests:**
- ✓ MCP Bridge startup
- ✓ Health endpoint
- ✓ All REST API endpoints
- ✓ Cache hit/miss behavior
- ✓ Frontend build
- ✓ End-to-end flow

## Running Workflows Locally

### MCP Bridge Tests

```bash
cd mcp-bridge

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run tests
pytest tests/ -v

# Run linting
pip install flake8 black mypy
flake8 . --exclude=venv
black --check . --exclude=venv
mypy . --ignore-missing-imports --exclude=venv

# Check compilation
python -m compileall . -q -x venv
```

### Frontend Tests

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm test

# Build
npm run build
```

### Integration Tests

```bash
# Terminal 1: Start MCP Bridge
cd mcp-bridge
export GITHUB_ORGANIZATION=test-org
export MCP_SERVER_PATH=/path/to/mock/server.py
python main.py

# Terminal 2: Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/repos
```

## Secrets Required

The following secrets should be configured in GitHub repository settings:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `GITHUB_TOKEN` | GitHub API token | All workflows (auto-provided) |
| `CODECOV_TOKEN` | Codecov upload token | Coverage reporting (optional) |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## Status Badges

Add these to your README.md:

```markdown
[![MCP Bridge Tests](https://github.com/YOUR_ORG/github-knowledge-vault/workflows/MCP%20Bridge%20Tests/badge.svg)](https://github.com/YOUR_ORG/github-knowledge-vault/actions/workflows/mcp-bridge.yml)
[![Frontend Tests](https://github.com/YOUR_ORG/github-knowledge-vault/workflows/Frontend%20Tests/badge.svg)](https://github.com/YOUR_ORG/github-knowledge-vault/actions/workflows/frontend.yml)
[![Integration Tests](https://github.com/YOUR_ORG/github-knowledge-vault/workflows/Integration%20Tests/badge.svg)](https://github.com/YOUR_ORG/github-knowledge-vault/actions/workflows/integration.yml)
```

## Workflow Features

### Caching

All workflows use caching to speed up builds:
- **Python**: `pip` cache for dependencies
- **Node.js**: `npm` cache for dependencies

### Matrix Strategy

- **MCP Bridge**: Tests on Python 3.10, 3.11, 3.12
- **Frontend**: Tests on Node.js 18, 20

### Fail-Fast

Disabled on test matrices to see results from all versions even if one fails.

### Continue-on-Error

Some steps (linting, security checks) are set to continue on error to not block the build for warnings.

## Troubleshooting

### Workflow not triggering

Check the `paths` filter in the workflow file. Workflows only trigger when files in those paths change.

### Tests failing locally but passing in CI

- Check environment variables
- Ensure you're using the same Python/Node version
- Clear caches: `pip cache purge`, `npm cache clean --force`

### Tests passing locally but failing in CI

- Check for missing dependencies in requirements.txt/package.json
- Look for hardcoded paths or environment-specific code
- Check for race conditions in async code

### Coverage not uploading

- Ensure `CODECOV_TOKEN` secret is set (if using Codecov)
- Check that coverage files are generated in the expected location
- Verify Codecov action version is up to date

## Adding New Workflows

1. Create a new `.yml` file in `.github/workflows/`
2. Define triggers (`on:` section)
3. Define jobs and steps
4. Test locally if possible
5. Commit and push to trigger the workflow
6. Monitor in the Actions tab

## Maintenance

These workflows should be reviewed and updated:
- When Python/Node.js versions change
- When new dependencies are added
- When test structure changes
- Quarterly to update action versions

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Python Setup Action](https://github.com/actions/setup-python)
- [Node Setup Action](https://github.com/actions/setup-node)
- [Codecov Action](https://github.com/codecov/codecov-action)
