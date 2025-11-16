# GitHub Actions Workflows

This directory contains CI/CD workflows for the GitHub Knowledge Vault project.

## Workflows

### 1. MCP Bridge Tests (`mcp-bridge.yml`)

Runs tests for the Python MCP Bridge backend.

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches (when bridge files change)
- Pull requests to `main` or `develop` (when bridge files change)

**What it does:**
- Sets up Python 3.11
- Installs dependencies from requirements.txt
- Runs pytest tests in mcp-bridge/tests/

### 2. Frontend Tests (`frontend.yml`)

Runs tests for the React TypeScript frontend.

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches (when frontend files change)
- Pull requests to `main` or `develop` (when frontend files change)

**What it does:**
- Sets up Node.js 20
- Installs dependencies with npm ci
- Runs existing Vitest tests with npm test

### 3. Integration Tests (`integration.yml`)

Tests the entire stack (Frontend + MCP Bridge) together.

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**What it does:**
- Sets up Python 3.11 and Node.js 20
- Creates a mock MCP Server for testing
- Runs MCP Bridge tests
- Runs Frontend tests
- Tests Frontend build

## Running Tests Locally

### MCP Bridge Tests

```bash
cd mcp-bridge

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run tests
pytest tests/ -v
```

### Frontend Tests

```bash
# Install dependencies
npm ci

# Run tests
npm test
```

### Integration Tests

```bash
# Run both test suites
cd mcp-bridge && pytest tests/ -v && cd ..
npm test -- --run
npm run build
```

## Features

- **Dependency Caching**: Uses pip and npm caching for faster builds
- **Path Filters**: Only runs when relevant files change
- **Environment Variables**: Proper test configuration

## Adding Status Badges

Add these to your README.md:

```markdown
[![MCP Bridge Tests](https://github.com/SPerekrestova/github-knowledge-vault/workflows/MCP%20Bridge%20Tests/badge.svg)](https://github.com/SPerekrestova/github-knowledge-vault/actions)
[![Frontend Tests](https://github.com/SPerekrestova/github-knowledge-vault/workflows/Frontend%20Tests/badge.svg)](https://github.com/SPerekrestova/github-knowledge-vault/actions)
[![Integration Tests](https://github.com/SPerekrestova/github-knowledge-vault/workflows/Integration%20Tests/badge.svg)](https://github.com/SPerekrestova/github-knowledge-vault/actions)
```

## Troubleshooting

### Workflow not triggering

Check the `paths` filter in the workflow file. Workflows only trigger when files in those paths change.

### Tests failing

- Check environment variables are set correctly
- Ensure dependencies are up to date
- Run tests locally first to verify they pass

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
