import { useSearchParams } from 'react-router-dom';
import { ContentType } from '@/types';

/**
 * Hook to manage documentation filters using URL query parameters as single source of truth
 * Enables deep linking: /docs?repo=xyz&type=markdown&q=api
 */
export const useDocumentationFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter values from URL
  const activeRepoId = searchParams.get('repo');
  const activeContentType = searchParams.get('type') as ContentType | null;
  const searchQuery = searchParams.get('q') || '';
  const selectedContentId = searchParams.get('content');

  // Setters that update URL params
  const setActiveRepoId = (repoId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (repoId) {
      newParams.set('repo', repoId);
    } else {
      newParams.delete('repo');
    }
    // Clear content selection when changing repo
    newParams.delete('content');
    setSearchParams(newParams);
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
    setSearchParams(newParams);
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
    setSearchParams(newParams);
  };

  const setSelectedContentId = (contentId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (contentId) {
      newParams.set('content', contentId);
    } else {
      newParams.delete('content');
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
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
