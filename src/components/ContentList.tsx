import { ContentItem, ContentType } from '@/types';
import { ContentListItem } from './ContentListItem';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { SkippedFile } from '@/utils/mcpService';

interface ContentListProps {
  content: ContentItem[];
  activeRepoName: string | null;
  activeContentType: ContentType | null;
  skippedFiles: SkippedFile[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onContentSelect: (contentId: string) => void;
}

/**
 * List display of filtered content items with header and skipped files
 */
export const ContentList = ({
  content,
  activeRepoName,
  activeContentType,
  skippedFiles,
  isRefreshing,
  onRefresh,
  onContentSelect
}: ContentListProps) => {
  return (
    <div>
      {/* Filter/Context Bar and Skipped Files Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          {activeRepoName && <h3 className="text-xl font-semibold text-gray-800">{activeRepoName}</h3>}
          {activeContentType && <span className="text-sm font-medium text-gray-600">{activeContentType}</span>}
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={onRefresh}
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

      {/* Skipped Files Display */}
      {activeRepoName && !activeContentType && skippedFiles.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold text-sm mb-2 text-red-700">Skipped Files in this Repository</div>
          <ul className="text-xs bg-red-50 border border-red-200 rounded p-2">
            {skippedFiles.map((f, idx) => (
              <li key={f.path + f.reason + idx} className="mb-1">
                <span className="font-mono text-gray-700">{f.name}</span>: <span className="text-gray-600">{f.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results Count */}
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        {content.length} {content.length === 1 ? 'result' : 'results'} found
      </h3>

      {/* Content Items or Empty State */}
      {content.length > 0 ? (
        <div className="grid gap-6">
          {content.map(item => (
            <div
              key={item.id}
              className="cursor-pointer"
            >
              <ContentListItem contentItem={item} onClick={() => onContentSelect(item.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 text-lg">
          No content matches your filters. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
};
