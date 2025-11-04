import { useSearchParams } from 'react-router-dom';
import { ContentType } from '@/types';

/**
 * Hook to manage documentation filters using URL query parameters for shareable state
 * Enables deep linking: /docs?repo=xyz&type=markdown&q=api
 *
 * Improvements:
 * - Uses replace instead of push for filter changes (better back button UX)
 * - Only content selection uses push (allows back navigation)
 */
export const useDocumentationFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter values from URL
  const activeRepoId = searchParams.get('repo');
  const activeContentType = searchParams.get('type') as ContentType | null;
  const searchQuery = searchParams.get('q') || '';
  const selectedContentId = searchParams.get('content');

  // Setters that update URL params with replace (better back button behavior)
  const setActiveRepoId = (repoId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (repoId) {
      newParams.set('repo', repoId);
    } else {
      newParams.delete('repo');
    }
    // Clear content selection when changing repo
    newParams.delete('content');
    // Use replace for filter changes (don't pollute history)
    setSearchParams(newParams, { replace: true });
  };

  const setActiveContentType = (contentType: ContentType | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (contentType) {
      newParams.set('type', contentType);
    } else {
      newParams.delete('type');
    }
    // Clear content selection when changing type
    newParams.delete('content');
    // Use replace for filter changes
    setSearchParams(newParams, { replace: true });
  };

  const setSearchQuery = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    // Clear content selection when searching
    newParams.delete('content');
    // Use replace for search (avoid history pollution from typing)
    setSearchParams(newParams, { replace: true });
  };

  const setSelectedContentId = (contentId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (contentId) {
      newParams.set('content', contentId);
    } else {
      newParams.delete('content');
    }
    // Use push for content selection (allows back navigation from content view)
    setSearchParams(newParams, { replace: false });
  };

  const resetFilters = () => {
    // Use replace when clearing all filters
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Check if any filters are active
  const hasActiveFilters = !!(activeRepoId || activeContentType || searchQuery);

  return {
    // Current filter values
    activeRepoId,
    activeContentType,
    searchQuery,
    selectedContentId,
    hasActiveFilters,

    // Setters
    setActiveRepoId,
    setActiveContentType,
    setSearchQuery,
    setSelectedContentId,
    resetFilters,
  };
};
