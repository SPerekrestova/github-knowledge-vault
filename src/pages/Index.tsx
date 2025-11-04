import { useState, useMemo } from 'react';
import { ContentType } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { RepoCard } from '@/components/RepoCard';
import { ContentViewer } from '@/components/ContentViewer';
import { ContentListItem } from '@/components/ContentListItem';
import { ContentContextHeader } from '@/components/ContentContextHeader';
import { RepositoryGridSkeleton, ContentListSkeleton } from '@/components/LoadingSkeletons';
import { useRepos } from '@/hooks/useRepos';
import { useContent } from '@/hooks/useContent';
import { skippedFiles } from '@/utils/githubService';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  };

  // Handle content type selection
  const handleContentTypeSelect = (contentType: ContentType | null) => {
    setActiveContentType(contentType);
    setSelectedContentId(null);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Reset all filters
  const handleReset = () => {
    setActiveRepoId(null);
    setActiveContentType(null);
    setSearchQuery('');
    setSelectedContentId(null);
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
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Prominent Search Section */}
        <div className="px-8 py-6 bg-gray-100 border-b border-gray-200 flex justify-center">
          <div className="w-full max-w-4xl">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {contentLoading ? (
              // Show appropriate skeleton based on current view
              (activeRepoId || activeContentType || searchQuery) ? (
                <ContentListSkeleton />
              ) : (
                <RepositoryGridSkeleton />
              )
            ) : (
              <>
                {/* Display selected content if any */}
                {selectedContent ? (
                  <div>
                    <button 
                      className="mb-6 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
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
                        {/* Filter/Context Bar and Skipped Files Summary */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                           <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                             {activeRepoName && (<h3 className="text-xl font-semibold text-gray-800">{activeRepoName}</h3>)}
                             {activeContentType && (<span className="text-sm font-medium text-gray-600">{activeContentType}</span>)}
                           </div>
                            <div className="flex items-center space-x-4">
                              {/* Secondary Search Input - Keep for now if needed for secondary filtering/search */}
                               {/* <div className="w-40"><Input type="search" placeholder="Search..." className="px-3 py-2 text-sm" /></div> */}
                              <Button
                                onClick={handleRefresh}
                                variant="outline"
                                size="sm"
                                disabled={isRefreshing}
                                className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-100"
                              >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                              </Button>
                           </div>
                        </div>
                         {activeRepoId && !activeContentType && !searchQuery && skippedFiles[activeRepoId] && skippedFiles[activeRepoId].length > 0 && (
                            <div className="mb-6">
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
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">
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
                                <ContentListItem contentItem={item} onClick={() => setSelectedContentId(item.id)} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 text-lg">
                            No content matches your filters. Try adjusting your search criteria.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {repositories.map(repo => {
                          const contentCount = contentCountByRepo.get(repo.id) || { markdown: 0, mermaid: 0, postman: 0 };
                          return (
                            <RepoCard
                              key={repo.id}
                              repo={repo}
                              contentCount={contentCount}
                              onClick={() => handleRepoSelect(repo.id)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
