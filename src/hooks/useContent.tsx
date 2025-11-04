import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ContentType } from '@/types';
import { githubService, SkippedFile } from '@/utils/githubService';
import { useDebounce } from './useDebounce';
import { APIError, NetworkError } from '@/utils/errors';
import { CONSTANTS } from '@/constants';

interface UseContentOptions {
  repoId?: string | null;
  contentType?: ContentType | null;
  searchQuery?: string;
}

/**
 * Hook to fetch and filter GitHub repository content
 * Uses React Query for caching and filters data client-side for performance
 */
export const useContent = (options: UseContentOptions = {}) => {
  const { repoId = null, contentType = null, searchQuery = '' } = options;

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, CONSTANTS.SEARCH_DEBOUNCE_MS);

  // Fetch all content once and cache it
  const {
    data: allContentData,
    isLoading,
    error,
    isFetching: refreshing,
    refetch
  } = useQuery({
    queryKey: ['content', 'all'],
    queryFn: githubService.getAllContentWithSkipped,
    staleTime: CONSTANTS.CACHE_TIME_MS, // Data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allContent = allContentData?.content || [];
  const allSkippedFiles = allContentData?.skippedFilesByRepo || {};

  // Fetch specific repo content if repoId is provided (for performance)
  const {
    data: repoContentData,
    isLoading: repoLoading,
    isFetching: repoRefreshing
  } = useQuery({
    queryKey: ['content', 'repo', repoId],
    queryFn: () => githubService.getRepoContent(repoId!),
    enabled: !!repoId, // Only fetch if repoId is provided
    staleTime: CONSTANTS.CACHE_TIME_MS,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const repoContent = repoContentData?.content || [];
  const repoSkippedFiles = repoContentData?.skippedFiles || [];

  // Client-side filtering - happens in memory, no API calls
  const filteredContent = useMemo(() => {
    // Use repo-specific content if filtering by repo, otherwise use all content
    let content = repoId ? repoContent : allContent;

    // Filter by content type
    if (contentType) {
      if (contentType === 'postman' || contentType === 'openapi') {
        // Group postman and openapi as "API Collections"
        content = content.filter(item =>
          item.type === 'postman' || item.type === 'openapi'
        );
      } else {
        content = content.filter(item => item.type === contentType);
      }
    }

    // Filter by search query (debounced)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      content = content.filter(item => {
        // Search in name (always fast)
        if (item.name.toLowerCase().includes(query)) return true;

        // Search in content, but limit to first 1000 chars for performance
        const contentPreview = item.content.substring(0, 1000).toLowerCase();
        return contentPreview.includes(query);
      });
    }

    return content;
  }, [allContent, repoContent, repoId, contentType, debouncedSearchQuery]);

  // Determine loading state
  const loading = repoId ? repoLoading : isLoading;
  const isRefreshing = repoId ? repoRefreshing : refreshing;

  // Get skipped files for current repo
  const currentSkippedFiles: SkippedFile[] = repoId
    ? repoSkippedFiles
    : [];

  // Get all skipped files by repo
  const skippedFilesByRepo = repoId
    ? (repoContentData ? { [repoId]: repoSkippedFiles } : {})
    : allSkippedFiles;

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
    return CONSTANTS.ERROR_MESSAGES.FETCH_CONTENT;
  };

  return {
    content: filteredContent,
    loading,
    error: getErrorMessage(),
    refreshing: isRefreshing,
    refetch,
    refresh: refetch,
    skippedFiles: currentSkippedFiles,
    skippedFilesByRepo
  };
};
