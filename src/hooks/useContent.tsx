import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ContentType } from '@/types';
import { mcpService, SkippedFile } from '@/utils/mcpService';
import { useDebounce } from './useDebounce';
import { APIError, NetworkError } from '@/utils/errors';
import { CONSTANTS } from '@/constants';

interface UseContentOptions {
  repoId?: string | null;
  contentType?: ContentType | null;
  searchQuery?: string;
}

/**
 * Hook to fetch and filter content via MCP Bridge
 *
 * OPTIMIZATION: Lazy loading strategy to fix N+1 problem
 * - Only fetches content when filters are applied or explicitly requested
 * - Uses repo-specific query when repoId is provided (1 API call instead of N)
 * - Avoids fetching all content upfront (previously N+1 API calls on page load)
 */
export const useContent = (options: UseContentOptions = {}) => {
  const { repoId = null, contentType = null, searchQuery = '' } = options;

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, CONSTANTS.SEARCH_DEBOUNCE_MS);

  // Determine if we should fetch all content or just specific repo
  // Fetch all content only when filters are applied without a specific repo (avoids N+1 on initial load)
  const shouldFetchAll = !repoId && (contentType || debouncedSearchQuery);

  // Fetch all content only when needed (lazy loading)
  const {
    data: allContentData,
    isLoading: allLoading,
    error: allError,
    isFetching: allRefreshing,
    refetch: refetchAll
  } = useQuery({
    queryKey: ['content', 'all'],
    queryFn: () => mcpService.getAllContentWithSkipped(),
    enabled: shouldFetchAll, // Only fetch when filters require it
    staleTime: CONSTANTS.CACHE_TIME_MS,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allContent = allContentData?.content || [];
  const allSkippedFiles = allContentData?.skippedFilesByRepo || {};

  // Fetch specific repo content if repoId is provided (MUCH faster - 1 API call)
  const {
    data: repoContentData,
    isLoading: repoLoading,
    error: repoError,
    isFetching: repoRefreshing,
    refetch: refetchRepo
  } = useQuery({
    queryKey: ['content', 'repo', repoId],
    queryFn: () => mcpService.getRepoContent(repoId!),
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
  const loading = repoId ? repoLoading : allLoading;
  const isRefreshing = repoId ? repoRefreshing : allRefreshing;

  // Determine error state
  const error = repoId ? repoError : allError;

  // Determine refetch function
  const refetch = repoId ? refetchRepo : refetchAll;

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
