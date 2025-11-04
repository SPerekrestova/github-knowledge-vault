import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching?: boolean;
}

/**
 * Search bar component for filtering documentation content
 */
export const SearchBar = ({ searchQuery, onSearchChange, isSearching = false }: SearchBarProps) => {
  return (
    <div className="px-8 py-6 bg-gray-100 border-b border-gray-200 flex justify-center">
      <div className="w-full max-w-4xl relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </span>
            ) : (
              <span>Search results updated</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
