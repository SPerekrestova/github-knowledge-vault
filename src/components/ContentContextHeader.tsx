import React from 'react';
import { ContentType } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ContentContextHeaderProps {
  repoName: string | null;
  contentType: ContentType | null;
}

export const ContentContextHeader: React.FC<ContentContextHeaderProps> = ({
  repoName,
  contentType,
}) => {
  const formatContentType = (type: ContentType | null): string => {
    if (!type) return '';
    
    switch (type) {
      case 'markdown':
        return 'Documentation';
      case 'mermaid':
        return 'Diagram';
      case 'postman':
      case 'openapi':
        return 'API Collection';
      default:
        return '';
    }
  };

  if (!repoName && !contentType) {
    return null; // Don't render if no context is available
  }

  return (
    <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
      {repoName && <span className="font-medium">{repoName}</span>}
      {repoName && contentType && <span>/</span>}
      {contentType && (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-1 rounded-full">
          {formatContentType(contentType)}
        </Badge>
      )}
    </div>
  );
}; 