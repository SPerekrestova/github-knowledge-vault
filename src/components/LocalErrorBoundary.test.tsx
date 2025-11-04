import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalErrorBoundary } from './LocalErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('LocalErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <LocalErrorBoundary>
        <div>Test content</div>
      </LocalErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and show fallback UI', () => {
    render(
      <LocalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LocalErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('should show custom fallback title', () => {
    render(
      <LocalErrorBoundary fallbackTitle="Custom Error Title">
        <ThrowError shouldThrow={true} />
      </LocalErrorBoundary>
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('should show Try Again button', () => {
    render(
      <LocalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LocalErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it('should call custom onReset handler when provided', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <LocalErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </LocalErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    await user.click(button);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
