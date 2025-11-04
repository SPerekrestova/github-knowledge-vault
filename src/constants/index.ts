/**
 * Application-wide constants
 * Centralizes magic numbers and strings for better maintainability
 */

export const CONSTANTS = {
  // GitHub API
  DOC_FOLDER_NAME: 'doc',

  // UI/Display
  MAX_DIAGRAM_HEIGHT: 400,
  SEARCH_DEBOUNCE_MS: 300,

  // Caching (for future implementation)
  CACHE_TIME_MS: 5 * 60 * 1000, // 5 minutes

  // Error messages
  ERROR_MESSAGES: {
    AUTH_FAILED: 'Authentication failed. Please check your GitHub token.',
    RATE_LIMIT: 'GitHub rate limit exceeded. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    FETCH_REPOS: 'Failed to fetch repositories. Please try again.',
    FETCH_CONTENT: 'Failed to fetch content. Please try again.',
    INVALID_TOKEN: 'Invalid or missing GitHub token.',
    NOT_FOUND: 'The requested resource was not found.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMIT_EXCEEDED: 403,
  },

  // Styles (commonly used values)
  STYLES: {
    MAX_DIAGRAM_HEIGHT: '400px',
    SEARCH_DEBOUNCE_MS: 300,
  },
} as const;

// Type exports for better TypeScript support
export type ErrorMessage = typeof CONSTANTS.ERROR_MESSAGES[keyof typeof CONSTANTS.ERROR_MESSAGES];
export type HttpStatus = typeof CONSTANTS.HTTP_STATUS[keyof typeof CONSTANTS.HTTP_STATUS];
