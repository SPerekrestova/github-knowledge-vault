import React from 'react';
import { ContentItem } from '@/types';
import { Card } from '@/components/ui/card';
import { ArrowRightIcon, FileTextIcon, BookOpenIcon, CodeIcon } from 'lucide-react';

interface ContentListItemProps {
  contentItem: ContentItem;
  onClick: () => void;
}

const renderContentTypeIcon = (type: ContentItem['type']) => {
  switch (type) {
    case 'markdown':
      return <BookOpenIcon className="h-4 w-4 text-blue-600" />;
    case 'mermaid':
      return <CodeIcon className="h-4 w-4 text-green-600" />;
    case 'postman':
    case 'openapi':
      return <CodeIcon className="h-4 w-4 text-purple-600" />;
    default:
      return <FileTextIcon className="h-4 w-4 text-gray-500" />;
  }
};

export const ContentListItem: React.FC<ContentListItemProps> = ({
  contentItem,
  onClick,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card 
      className="cursor-pointer p-4 hover:bg-gray-100 transition-colors duration-200 border-b border-gray-200 shadow-none rounded-none first:rounded-t-lg last:rounded-b-lg last:border-b-0"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {renderContentTypeIcon(contentItem.type)}
          <h3 className="text-base font-medium text-gray-800 truncate pr-4">{contentItem.name}</h3>
        </div>
        <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
      {(contentItem.lastUpdated) && (
        <div className="mt-1 text-sm text-gray-500 pl-7">
           Updated {formatDate(contentItem.lastUpdated)}
        </div>
      )}
    </Card>
  );
}; 