
import { useState, useEffect } from 'react';
import { Repository } from '@/types';
import { githubService } from '@/utils/githubService';

export const useRepos = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const repos = await githubService.getRepositories();
      setRepositories(repos);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError('Failed to fetch repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshRepositories = async () => {
    setRefreshing(true);
    try {
      // TODO: Add actual refresh logic here
      await githubService.refreshAllData();
      const repos = await githubService.getRepositories();
      setRepositories(repos);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh repositories:', err);
      setError('Failed to refresh repositories. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return {
    repositories,
    loading,
    error,
    refreshing,
    refetch: fetchRepositories,
    refresh: refreshRepositories
  };
};
