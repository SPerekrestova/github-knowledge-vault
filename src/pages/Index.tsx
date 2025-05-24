import { useState, useMemo } from 'react';
import { ContentType } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { FilterBar } from '@/components/FilterBar';
import { RepoCard } from '@/components/RepoCard';
import { ContentViewer } from '@/components/ContentViewer';
import { useRepos } from '@/hooks/useRepos';
import { useContent } from '@/hooks/useContent';
import { skippedFiles } from '@/utils/githubService';

const Index = () => {
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<ContentType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  const { repositories, refreshing: reposRefreshing, refresh: refreshRepos } = useRepos();
  const { 
    content, 
    loading: contentLoading,
    refreshing: contentRefreshing,
    updateFilter,
    refresh: refreshContent
  } = useContent({
    repoId: activeRepoId,
    contentType: activeContentType,
    searchQuery
  });
  
  // Combined refresh state
  const isRefreshing = reposRefreshing || contentRefreshing;

  // Handle refresh - refresh both repos and content
  const handleRefresh = async () => {
    await Promise.all([
      refreshRepos(),
      refreshContent()
    ]);
  };
  
  // Get active repository name
  const activeRepoName = useMemo(() => {
    if (!activeRepoId) return null;
    const repo = repositories.find(r => r.id === activeRepoId);
    return repo ? repo.name : null;
  }, [activeRepoId, repositories]);
  
  // Get content counts by repository
  const contentCountByRepo = useMemo(() => {
    const counts = new Map<string, { markdown: number, mermaid: number, postman: number }>();
    repositories.forEach(repo => {
      counts.set(repo.id, { markdown: 0, mermaid: 0, postman: 0 });
    });
    content.forEach(item => {
      const repoCount = counts.get(item.repoId);
      if (repoCount) {
        if (item.type === 'postman' || item.type === 'openapi') {
          repoCount.postman += 1; // Count both as API collections
        } else if (item.type === 'markdown') {
          repoCount.markdown += 1;
        } else if (item.type === 'mermaid') {
          repoCount.mermaid += 1;
        }
      }
    });
    return counts;
  }, [repositories, content]);
  
  // Selected content item
  const selectedContent = useMemo(() => {
    if (!selectedContentId) return null;
    return content.find(item => item.id === selectedContentId) || null;
  }, [selectedContentId, content]);
  
  // Handle repository selection
  const handleRepoSelect = (repoId: string | null) => {
    setActiveRepoId(repoId);
    setSelectedContentId(null);
    updateFilter({ repoId });
  };
  
  // Handle content type selection
  const handleContentTypeSelect = (contentType: ContentType | null) => {
    setActiveContentType(contentType);
    setSelectedContentId(null);
    updateFilter({ contentType });
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilter({ searchQuery: query });
  };
  
  // Reset all filters
  const handleReset = () => {
    setActiveRepoId(null);
    setActiveContentType(null);
    setSearchQuery('');
    setSelectedContentId(null);
    updateFilter({ repoId: null, contentType: null, searchQuery: '' });
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeRepoId={activeRepoId}
        activeContentType={activeContentType}
        onRepoSelect={handleRepoSelect}
        onContentTypeSelect={handleContentTypeSelect}
        onReset={handleReset}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <FilterBar
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          activeRepoName={activeRepoName}
          activeContentType={activeContentType}
          isRefreshing={isRefreshing}
        />
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {contentLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Display selected content if any */}
              {selectedContent ? (
                <div className="max-w-4xl mx-auto">
                  <button 
                    className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
                    onClick={() => setSelectedContentId(null)}
                  >
                    ← Back to list
                  </button>
                  <ContentViewer contentItem={selectedContent} />
                </div>
              ) : (
                <>
                  {/* Display content grid or repository grid */}
                  {(activeRepoId || activeContentType || searchQuery) ? (
                    <div>
                      {/* Skipped files summary at top of repo view */}
                      {activeRepoId && !activeContentType && !searchQuery && skippedFiles[activeRepoId] && skippedFiles[activeRepoId].length > 0 && (
                        <div className="mb-6 max-w-4xl mx-auto">
                          <div className="font-semibold text-sm mb-2 text-red-700">Skipped Files in this Repository</div>
                          <ul className="text-xs bg-red-50 border border-red-200 rounded p-2">
                            {skippedFiles[activeRepoId].map((f, idx) => (
                              <li key={f.path + f.reason + idx} className="mb-1">
                                <span className="font-mono text-gray-700">{f.name}</span>: <span className="text-gray-600">{f.reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <h3 className="text-lg font-medium mb-4">
                        {content.length} {content.length === 1 ? 'result' : 'results'} found
                      </h3>
                      
                      {content.length > 0 ? (
                        <div className="grid gap-6">
                          {content.map(item => (
                            <div 
                              key={item.id} 
                              className="cursor-pointer"
                              onClick={() => setSelectedContentId(item.id)}
                            >
                              <ContentViewer contentItem={item} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No content matches your filters. Try adjusting your search criteria.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Repositories</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {repositories.map(repo => (
                          <RepoCard 
                            key={repo.id}
                            repo={repo}
                            contentCount={contentCountByRepo.get(repo.id) || { markdown: 0, mermaid: 0, postman: 0 }}
                            onClick={() => handleRepoSelect(repo.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
