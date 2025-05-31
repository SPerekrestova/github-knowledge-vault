import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ContentType } from '@/types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  activeRepoName: string | null;
  activeContentType: ContentType | null;
  isRefreshing?: boolean;
}

export const FilterBar = ({ 
  onSearch, 
  onRefresh, 
  activeRepoName, 
  activeContentType,
  isRefreshing = false 
}: FilterBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Format content type for display
  const formatContentType = (type: ContentType | null): string => {
    if (!type) return '';
    
    switch (type) {
      case 'markdown':
        return 'Documentation';
      case 'mermaid':
        return 'Diagrams';
      case 'postman':
        return 'API Collections';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center px-6 py-3 border-b bg-gray-50">
      <div className="flex items-center mb-4 md:mb-0">
        <h2 className="text-lg font-semibold text-gray-800">
          {activeRepoName ? activeRepoName : 'All Repositories'}
          {activeContentType && (
            <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 py-1 px-2 rounded-full border border-blue-300">
              {formatContentType(activeContentType)}
            </span>
          )}
        </h2>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-100"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing ? 'animate-spin' : '')} />
          Refresh
        </Button>
        <div className="w-full md:w-80">
          <Input
            type="search"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
};
