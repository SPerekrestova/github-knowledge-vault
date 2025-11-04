import { useQuery } from '@tanstack/react-query';
import { Repository } from '@/types';
import { githubService } from '@/utils/githubService';

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
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    repositories,
    loading,
    error: error ? 'Failed to fetch repositories. Please try again.' : null,
    refreshing,
    refetch,
    refresh: refetch // Alias for backward compatibility
  };
};
