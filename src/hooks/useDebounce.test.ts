import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedValue } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    expect(result.current).toBe('first');

    // Change the value
    rerender({ value: 'second', delay: 500 });
    expect(result.current).toBe('first'); // Still the old value

    // Fast-forward time by 499ms (not enough)
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('first');

    // Fast-forward by 1 more ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second'); // Now updated
  });

  it('should reset timer on value change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    // Change to 'second'
    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Change to 'third' before timer completes
    rerender({ value: 'third' });
    expect(result.current).toBe('first'); // Still 'first'

    // Complete the new timer
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('third'); // Skipped 'second', went to 'third'
  });

  it('should handle custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 1000 },
      }
    );

    rerender({ value: 'second', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });
});

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return value and isPending false initially', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current.value).toBe('initial');
    expect(result.current.isPending).toBe(false);
  });

  it('should set isPending to true when value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    expect(result.current.isPending).toBe(false);

    // Change value
    rerender({ value: 'second' });
    expect(result.current.isPending).toBe(true);
    expect(result.current.value).toBe('first'); // Value not updated yet
  });

  it('should set isPending to false after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    rerender({ value: 'second' });
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.value).toBe('second');
  });

  it('should handle multiple rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'first' },
      }
    );

    // Rapid changes
    rerender({ value: 'second' });
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'third' });
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'fourth' });
    expect(result.current.isPending).toBe(true);

    // Complete the final timer
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.value).toBe('fourth');
  });
});
