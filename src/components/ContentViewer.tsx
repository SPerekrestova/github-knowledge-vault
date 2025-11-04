import { useState } from 'react';
import { ContentItem, ContentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiagramModal } from '@/components/DiagramModal';
import {
  MarkdownViewer,
  MermaidViewer,
  PostmanCollectionViewer,
  OpenAPIViewer,
  SVGViewer
} from '@/components/viewers';

interface ContentViewerProps {
  contentItem: ContentItem;
}

/**
 * Main content viewer component - orchestrates different viewer types
 *
 * REFACTORED: Reduced from 577 lines to ~120 lines
 * - Extracted rendering logic into specialized viewer components
 * - Removed module-level state (mermaid initialization)
 * - Eliminated code duplication
 * - Better separation of concerns
 */
export const ContentViewer = ({ contentItem }: ContentViewerProps) => {
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'markdown':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-1 rounded-full">Documentation</Badge>;
      case 'mermaid':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1 rounded-full">Diagram</Badge>;
      case 'postman':
      case 'openapi':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs px-2 py-1 rounded-full">API Collection</Badge>;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (contentItem.type) {
      case 'markdown':
        return <MarkdownViewer content={contentItem.content} />;

      case 'mermaid':
        return (
          <MermaidViewer
            content={contentItem.content}
            onExpand={() => setIsDiagramModalOpen(true)}
          />
        );

      case 'svg':
        return (
          <SVGViewer
            content={contentItem.content}
            name={contentItem.name}
            onExpand={() => setIsDiagramModalOpen(true)}
          />
        );

      case 'postman':
        return <PostmanCollectionViewer content={contentItem.content} />;

      case 'openapi':
        return <OpenAPIViewer content={contentItem.content} />;

      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
    <>
      <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-2xl font-semibold text-gray-800">{contentItem.name}</CardTitle>
          <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
            {contentItem.lastUpdated && (
              <span>Updated {formatDate(contentItem.lastUpdated)}</span>
            )}
            {renderContentTypeLabel(contentItem.type)}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>

      {/* Diagram Modal for fullscreen view */}
      {(contentItem.type === 'mermaid' || contentItem.type === 'svg') && (
        <DiagramModal
          isOpen={isDiagramModalOpen}
          onClose={() => setIsDiagramModalOpen(false)}
          diagramType={contentItem.type}
          content={contentItem.content}
          title={contentItem.name}
        />
      )}
    </>
  );
};
