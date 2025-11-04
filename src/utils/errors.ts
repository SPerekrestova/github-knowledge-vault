/**
 * Custom error classes for better error handling and type safety
 */

import { CONSTANTS } from '@/constants';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }

  /**
   * Creates an APIError from a fetch response
   */
  static async fromResponse(response: Response): Promise<APIError> {
    let details;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    let message;

    switch (response.status) {
      case CONSTANTS.HTTP_STATUS.UNAUTHORIZED:
        message = CONSTANTS.ERROR_MESSAGES.AUTH_FAILED;
        break;
      case CONSTANTS.HTTP_STATUS.FORBIDDEN:
        message = CONSTANTS.ERROR_MESSAGES.RATE_LIMIT;
        break;
      case CONSTANTS.HTTP_STATUS.NOT_FOUND:
        message = CONSTANTS.ERROR_MESSAGES.NOT_FOUND;
        break;
      default:
        message = `GitHub API error: ${response.status}`;
    }

    return new APIError(response.status, message, details);
  }

  /**
   * Gets a user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }
}

export class NetworkError extends Error {
  constructor(message: string = CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR) {
    super(message);
    this.name = 'NetworkError';
  }
}
