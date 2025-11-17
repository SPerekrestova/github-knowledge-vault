/**
 * MCP Bridge Configuration
 */

export const githubConfig = {
  // MCP Bridge endpoint
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_URL || 'http://localhost:3001',

  // GitHub organization name
  organization: import.meta.env.VITE_GITHUB_ORGANIZATION || '',
} as const;

// Validation
if (!githubConfig.organization) {
  console.error('❌ VITE_GITHUB_ORGANIZATION is required');
  throw new Error('Missing required environment variable: VITE_GITHUB_ORGANIZATION');
}

if (!githubConfig.mcpBridgeUrl) {
  console.error('❌ VITE_MCP_BRIDGE_URL is required');
  throw new Error('Missing required environment variable: VITE_MCP_BRIDGE_URL');
}

// Log configuration (development only)
if (import.meta.env.DEV) {
  console.log('📋 Configuration:', {
    mcpBridgeUrl: githubConfig.mcpBridgeUrl,
    organization: githubConfig.organization,
  });
}

export default githubConfig;