import { describe, it, expect } from 'vitest';
import { APIError, NetworkError } from './errors';

describe('Error Classes', () => {
  describe('APIError', () => {
    it('should create an APIError with status code and message', () => {
      const error = new APIError(404, 'Not Found');

      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.name).toBe('APIError');
    });

    it('should return message from getUserMessage', () => {
      const error = new APIError(404, 'Custom error message');
      const userMessage = error.getUserMessage();

      expect(userMessage).toBe('Custom error message');
    });

    it('should support optional details parameter', () => {
      const details = { reason: 'Resource not found' };
      const error = new APIError(404, 'Not Found', details);

      expect(error.details).toEqual(details);
    });

    it('should handle 500 errors', () => {
      const error = new APIError(500, 'Internal Server Error');

      expect(error.status).toBe(500);
      expect(error.message).toBe('Internal Server Error');
    });

    it('should handle any status code', () => {
      const error = new APIError(418, "I'm a teapot");

      expect(error.status).toBe(418);
      expect(error.getUserMessage()).toBe("I'm a teapot");
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with custom message', () => {
      const error = new NetworkError('Connection timeout');

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Connection timeout');
      expect(error.name).toBe('NetworkError');
    });

    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Network error. Please check your connection and try again.');
      expect(error.name).toBe('NetworkError');
    });
  });
});
