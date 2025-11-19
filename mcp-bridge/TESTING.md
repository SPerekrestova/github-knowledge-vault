# MCP Bridge Testing Guide

This document explains how to test the MCP Bridge Docker integration.

## Overview

The MCP Bridge now uses Docker to spawn MCP Server containers instead of running a local Python file. This document covers three types of tests:

1. **Configuration Verification** - Validates files are configured correctly (no Docker needed)
2. **Integration Testing** - Tests actual Docker connectivity (requires Docker)
3. **Manual Testing** - Step-by-step manual verification

---

## 1. Configuration Verification Test

**Purpose:** Verify that all configuration files are correctly set up to use Docker.

**Requirements:** Python 3.10+ only (no Docker needed)

**Run:**
```bash
cd mcp-bridge
python test_docker_config.py
```

**What it checks:**
- ✅ `mcp_client.py` uses Docker command instead of Python
- ✅ `main.py` uses `MCP_SERVER_IMAGE` environment variable
- ✅ `.env.example` has Docker configuration
- ✅ `docker-compose.yml` mounts Docker socket
- ✅ README documentation updated
- ✅ Dockerfile exists
- ✅ Docker command construction logic

**Expected Output:**
```
============================================================
Results: 7/7 tests passed
============================================================

✅ ALL CONFIGURATION TESTS PASSED
```

---

## 2. Integration Test with Docker

**Purpose:** Test actual Docker connectivity and MCP Server communication.

**Requirements:**
- Docker installed and running
- GitHub personal access token
- Python 3.10+
- MCP Python SDK (`pip install mcp`)

**Setup:**
```bash
# 1. Install dependencies
cd mcp-bridge
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Set environment variable
export GITHUB_TOKEN=ghp_your_token_here

# 3. Run integration test
python test_docker_integration.py
```

**What it tests:**
- ✅ Docker is available and running
- ✅ Can pull MCP Server Docker image
- ✅ Can construct correct Docker command
- ✅ Can spawn MCP Server container
- ✅ Can establish MCP protocol connection via stdio
- ✅ Can execute MCP tool calls
- ✅ Properly cleans up containers

**Expected Output:**
```
============================================================
✅ ALL TESTS PASSED
============================================================

The MCP Bridge successfully:
  ✅ Detected Docker installation
  ✅ Pulled the MCP Server Docker image
  ✅ Connected to MCP Server via Docker
  ✅ Executed MCP tool calls
  ✅ Cleaned up resources
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| `Docker is not available` | Install Docker and start the daemon |
| `Permission denied` | Add user to docker group: `sudo usermod -aG docker $USER` |
| `Image pull failed` | Check internet connection and Docker Hub access |
| `Connection timeout` | Increase timeout or check firewall settings |
| `Tool call failed` | Verify GITHUB_TOKEN is valid and has required scopes |

---

## 3. Manual Testing

### Step 1: Pull MCP Server Image

```bash
docker pull ghcr.io/sperekrestova/github-mcp-server:latest
```

**Verify:**
```bash
docker images | grep mcp-server
```

Should show:
```
ghcr.io/sperekrestova/github-mcp-server  latest  abc123  5 minutes ago  150MB
```

### Step 2: Test Manual Docker Run

Test that the MCP Server can run as a container:

```bash
# Set environment variables
export GITHUB_TOKEN=ghp_your_token
export GITHUB_ORG=octocat

# Run container interactively
docker run -i --rm \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e GITHUB_ORG=$GITHUB_ORG \
  ghcr.io/sperekrestova/github-mcp-server:latest
```

**Expected:** Container starts and waits for MCP protocol input.

**To exit:** Press Ctrl+C

### Step 3: Start MCP Bridge

```bash
cd mcp-bridge

# Copy and configure environment
cp .env.example .env
nano .env  # Edit GITHUB_ORGANIZATION and GITHUB_TOKEN

# Install dependencies (if not done)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start bridge
python main.py
```

**Expected Output:**
```
INFO - Starting MCP Bridge...
INFO -    Organization: your-org
INFO -    MCP Server Image: ghcr.io/sperekrestova/github-mcp-server:latest
INFO -    Cache: Enabled (TTL: 300s)
INFO - Connecting to MCP Server Docker image: ghcr.io/sperekrestova/github-mcp-server:latest
INFO - Docker command: docker run -i --rm -e GITHUB_TOKEN=... -e GITHUB_ORG=your-org ghcr.io/sperekrestova/github-mcp-server:latest
INFO - ✅ Connected to MCP Server via Docker
INFO - MCP Bridge ready
INFO - Application startup complete.
INFO - Uvicorn running on http://0.0.0.0:3001
```

### Step 4: Test Health Endpoint

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "cache_size": 0,
  "mcp_connected": true
}
```

**Key field:** `"mcp_connected": true` - This confirms Docker connection works!

### Step 5: Test API Endpoints

**Test repositories endpoint:**
```bash
curl http://localhost:3001/api/repos
```

**Expected:** List of repositories with `hasDocFolder` field.

**Test content endpoint:**
```bash
curl http://localhost:3001/api/content/your-repo-name
```

**Expected:** List of documentation files from `/doc` folder.

### Step 6: Verify Docker Container Behavior

While the bridge is running, check Docker containers:

```bash
# In another terminal
docker ps
```

**Expected:** You should see an MCP Server container when API calls are being made.

**After idle time:** Container should be cleaned up (due to `--rm` flag).

### Step 7: Check Logs

Bridge logs should show:
- Docker command execution
- MCP Server connection
- Tool calls
- Container cleanup

```bash
# Bridge logs show Docker interaction
tail -f mcp-bridge.log  # if logging to file
```

---

## 4. Docker Compose Testing

Test the full stack with Docker Compose:

```bash
# From project root
cd /path/to/github-knowledge-vault

# Create .env file
cat > .env <<EOF
GITHUB_TOKEN=ghp_your_token
GITHUB_ORGANIZATION=your-org
EOF

# Start all services
docker-compose up
```

**Expected:**
- MCP Bridge container starts
- Frontend container starts
- Bridge spawns MCP Server containers as needed
- Health check at http://localhost:3001/health shows `mcp_connected: true`
- Frontend accessible at http://localhost

**Verify Docker socket mount:**
```bash
docker-compose exec mcp-bridge docker ps
```

Should show Docker containers (proves socket is mounted).

---

## 5. Troubleshooting

### MCP Bridge Won't Start

**Check Docker availability:**
```bash
docker info
```

**Check image exists:**
```bash
docker images | grep mcp-server
```

**Check environment variables:**
```bash
# Inside mcp-bridge directory
cat .env
```

### "Failed to connect to MCP Server"

**Check Docker daemon:**
```bash
systemctl status docker  # Linux
docker info              # All platforms
```

**Check Docker socket permissions:**
```bash
ls -l /var/run/docker.sock
# Should be writable by your user or docker group
```

**Test manual docker run:**
```bash
docker run -i --rm ghcr.io/sperekrestova/github-mcp-server:latest
```

### "Tool call failed"

**Check GitHub token:**
- Token should start with `ghp_`
- Required scopes: `repo`, `read:org`, `read:user`
- Test: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user`

**Check organization name:**
- Must be exact match (case-sensitive)
- User account names also work

### Container Not Cleaning Up

**Check running containers:**
```bash
docker ps -a | grep mcp-server
```

**Manual cleanup:**
```bash
docker rm -f $(docker ps -a -q --filter ancestor=ghcr.io/sperekrestova/github-mcp-server:latest)
```

---

## 6. Test Results Summary

### ✅ Configuration Tests (Passed)

All configuration files correctly set up for Docker:
- mcp_client.py uses Docker command
- main.py uses MCP_SERVER_IMAGE
- .env.example has Docker config
- docker-compose.yml mounts Docker socket
- Documentation updated

### 📋 Integration Tests (Requires Docker)

To verify full integration:
1. Install Docker
2. Set GITHUB_TOKEN
3. Run `python test_docker_integration.py`

### 🔧 Manual Verification

Follow steps in section 3 to manually verify:
- Docker image pull
- Container spawning
- MCP protocol communication
- API endpoint functionality

---

## 7. CI/CD Integration

For automated testing in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test MCP Bridge Configuration
  run: |
    cd mcp-bridge
    python test_docker_config.py

- name: Test MCP Bridge Integration
  run: |
    cd mcp-bridge
    docker pull ghcr.io/sperekrestova/github-mcp-server:latest
    python test_docker_integration.py
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Conclusion

The MCP Bridge is correctly configured to use Docker for MCP Server deployment. All configuration tests pass, and the integration is ready for testing in environments with Docker installed.

**Next Steps:**
1. ✅ Configuration validated (test_docker_config.py passed)
2. 🔄 Integration testing (requires Docker environment)
3. 🚀 Production deployment (via Docker Compose)

For questions or issues, see the main README.md or open an issue on GitHub.
