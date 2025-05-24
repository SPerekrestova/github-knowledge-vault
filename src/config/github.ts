// Centralized configuration with validation
export const githubConfig = {
    owner: import.meta.env.VITE_GITHUB_OWNER,
    ownerType: import.meta.env.VITE_GITHUB_OWNER_TYPE,
    apiBaseUrl: import.meta.env.VITE_GITHUB_API_BASE_URL,
    token: import.meta.env.VITE_GITHUB_TOKEN
};

// Validate required config
if (!githubConfig.owner || !githubConfig.token) {
    console.error('Missing required GitHub configuration! Please check your .env file.');
}

export default githubConfig;