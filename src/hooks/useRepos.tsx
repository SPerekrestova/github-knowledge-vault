import { useQuery } from '@tanstack/react-query';
import { Repository } from '@/types';
import { githubService } from '@/utils/githubService';
import { APIError, NetworkError } from '@/utils/errors';
import { CONSTANTS } from '@/constants';

/**
 * Hook to fetch and cache GitHub repositories with /doc folder
 * Uses React Query for automatic caching, refetching, and background updates
 */
export const useRepos = () => {
  const {
    data: repositories = [],
    isLoading: loading,
    error,
    isFetching: refreshing,
    refetch
  } = useQuery({
    queryKey: ['repositories'],
    queryFn: githubService.getRepositories,
    staleTime: CONSTANTS.CACHE_TIME_MS, // Data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Generate user-friendly error message based on error type
  const getErrorMessage = (): string | null => {
    if (!error) return null;

    if (error instanceof APIError) {
      return error.getUserMessage();
    }

    if (error instanceof NetworkError) {
      return error.message;
    }

    // For other error types, return generic message
    return CONSTANTS.ERROR_MESSAGES.FETCH_REPOS;
  };

  return {
    repositories,
    loading,
    error: getErrorMessage(),
    refreshing,
    refetch,
    refresh: refetch // Alias for backward compatibility
  };
};
