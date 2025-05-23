
import { useState, useEffect } from 'react';
import { ContentItem, ContentType, FilterOptions } from '@/types';
import { githubService } from '@/utils/githubService';

export const useContent = (initialFilter?: Partial<FilterOptions>) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOptions>({
    repoId: initialFilter?.repoId || null,
    contentType: initialFilter?.contentType || null,
    searchQuery: initialFilter?.searchQuery || '',
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      let fetchedContent: ContentItem[] = [];

      if (filter.repoId && filter.contentType) {
        // Fetch content by repo and filter by type
        const repoContent = await githubService.getRepoContent(filter.repoId);
        fetchedContent = repoContent.filter(item => item.type === filter.contentType);
      } else if (filter.repoId) {
        // Fetch content by repo only
        fetchedContent = await githubService.getRepoContent(filter.repoId);
      } else if (filter.contentType) {
        // Fetch content by type only
        fetchedContent = await githubService.getContentByType(filter.contentType);
      } else {
        // Fetch all content
        fetchedContent = await githubService.getAllContent();
      }

      // Apply search filter if present
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        fetchedContent = fetchedContent.filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
        );
      }

      setContent(fetchedContent);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to fetch content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [filter.repoId, filter.contentType, filter.searchQuery]);

  const updateFilter = (newFilter: Partial<FilterOptions>) => {
    setFilter(prevFilter => ({
      ...prevFilter,
      ...newFilter
    }));
  };

  return {
    content,
    loading,
    error,
    filter,
    updateFilter,
    refetch: fetchContent
  };
};
