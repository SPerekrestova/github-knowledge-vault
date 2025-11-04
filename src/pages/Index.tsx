import { useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { RepositoryGrid } from '@/components/RepositoryGrid';
import { ContentList } from '@/components/ContentList';
import { ContentViewer } from '@/components/ContentViewer';
import { RepositoryGridSkeleton, ContentListSkeleton } from '@/components/LoadingSkeletons';
import { LocalErrorBoundary } from '@/components/LocalErrorBoundary';
import { useRepos } from '@/hooks/useRepos';
import { useContent } from '@/hooks/useContent';
import { useDocumentationFilters } from '@/hooks/useDocumentationFilters';
import { useDebouncedValue } from '@/hooks/useDebounce';

/**
 * Main documentation page - orchestrates data fetching and UI rendering
 * Uses URL query params for state management to enable deep linking
 */
const Index = () => {
  // URL-based filter management (single source of truth)
  const {
    activeRepoId,
    activeContentType,
    searchQuery,
    selectedContentId,
    hasActiveFilters,
    setActiveRepoId,
    setActiveContentType,
    setSearchQuery,
    setSelectedContentId,
    resetFilters
  } = useDocumentationFilters();

  // Track search debouncing state
  const { isPending: isSearchPending } = useDebouncedValue(searchQuery, 300);

  // Data fetching with React Query
  const { repositories, refreshing: reposRefreshing, refresh: refreshRepos } = useRepos();
  const {
    content,
    loading: contentLoading,
    refreshing: contentRefreshing,
    refresh: refreshContent,
    skippedFiles
  } = useContent({
    repoId: activeRepoId,
    contentType: activeContentType,
    searchQuery
  });
  
  // Combined refresh state
  const isRefreshing = reposRefreshing || contentRefreshing;

  // Handle refresh - refresh both repos and content
  const handleRefresh = async () => {
    await Promise.all([refreshRepos(), refreshContent()]);
  };

  // Get active repository name for display
  const activeRepoName = useMemo(() => {
    if (!activeRepoId) return null;
    const repo = repositories.find(r => r.id === activeRepoId);
    return repo ? repo.name : null;
  }, [activeRepoId, repositories]);

  // Get selected content item
  const selectedContent = useMemo(() => {
    if (!selectedContentId) return null;
    return content.find(item => item.id === selectedContentId) || null;
  }, [selectedContentId, content]);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for filtering - wrapped in error boundary */}
      <LocalErrorBoundary fallbackTitle="Sidebar Error" onReset={resetFilters}>
        <Sidebar
          activeRepoId={activeRepoId}
          activeContentType={activeContentType}
          onRepoSelect={setActiveRepoId}
          onContentTypeSelect={setActiveContentType}
          onReset={resetFilters}
        />
      </LocalErrorBoundary>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar - wrapped in error boundary */}
        <LocalErrorBoundary fallbackTitle="Search Error">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isSearching={isSearchPending && searchQuery.length > 0}
          />
        </LocalErrorBoundary>

        {/* Content area with results - wrapped in error boundary */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <LocalErrorBoundary
              fallbackTitle="Content Error"
              onReset={() => {
                setSelectedContentId(null);
                resetFilters();
              }}
            >
              {contentLoading ? (
                // Show appropriate skeleton based on current view
                hasActiveFilters ? <ContentListSkeleton /> : <RepositoryGridSkeleton />
              ) : selectedContent ? (
                // Show selected content with back button
                <div>
                  <button
                    className="mb-6 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                    onClick={() => setSelectedContentId(null)}
                  >
                    ← Back to list
                  </button>
                  <ContentViewer contentItem={selectedContent} />
                </div>
              ) : hasActiveFilters ? (
                // Show filtered content list
                <ContentList
                  content={content}
                  activeRepoName={activeRepoName}
                  activeContentType={activeContentType}
                  skippedFiles={skippedFiles}
                  isRefreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  onContentSelect={setSelectedContentId}
                />
              ) : (
                // Show repository grid (default view)
                <RepositoryGrid
                  repositories={repositories}
                  content={content}
                  onRepoSelect={setActiveRepoId}
                />
              )}
            </LocalErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
