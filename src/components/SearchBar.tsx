interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Search bar component for filtering documentation content
 */
export const SearchBar = ({ searchQuery, onSearchChange }: SearchBarProps) => {
  return (
    <div className="px-8 py-6 bg-gray-100 border-b border-gray-200 flex justify-center">
      <div className="w-full max-w-4xl">
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
        />
      </div>
    </div>
  );
};
