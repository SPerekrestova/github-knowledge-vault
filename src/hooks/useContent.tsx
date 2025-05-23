
import { useState, useEffect } from 'react';
import { ContentItem, ContentType, FilterOptions } from '@/types';
import { githubService } from '@/utils/githubService';

export const useContent = (initialFilter?: Partial<FilterOptions>) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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
        const repoContent = await githubService.getRepoContent(filter.repoId);
        fetchedContent = repoContent.filter(item => item.type === filter.contentType);
      } else if (filter.repoId) {
        fetchedContent = await githubService.getRepoContent(filter.repoId);
      } else if (filter.contentType) {
        fetchedContent = await githubService.getContentByType(filter.contentType);
      } else {
        fetchedContent = await githubService.getAllContent();
      }

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

  const refreshContent = async () => {
    setRefreshing(true);
    try {
      // TODO: Add actual refresh logic here
      await githubService.refreshAllData();
      await fetchContent();
    } catch (err) {
      console.error('Failed to refresh content:', err);
      setError('Failed to refresh content. Please try again.');
    } finally {
      setRefreshing(false);
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
    refreshing,
    filter,
    updateFilter,
    refetch: fetchContent,
    refresh: refreshContent
  };
};
