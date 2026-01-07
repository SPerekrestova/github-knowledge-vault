import { DocumentHeader } from './DocumentHeader';
import { DocumentTabs } from './DocumentTabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types';

interface DocumentViewerProps {
  document: Document | null;
  isLoading?: boolean;
  onClose?: () => void;
  onCopyContent?: () => void;
  onDownload?: () => void;
  onOpenExternal?: () => void;
}

// Mock history for demo
const mockHistory = [
  {
    version: 'v2.1.0',
    date: new Date(),
    author: 'john.doe',
    message: 'Updated API endpoints documentation',
  },
  {
    version: 'v2.0.0',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    author: 'jane.smith',
    message: 'Major refactor for v2 API',
  },
  {
    version: 'v1.5.0',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    author: 'john.doe',
    message: 'Added webhook documentation',
  },
];

export const DocumentViewer = ({
  document,
  isLoading = false,
  onClose,
  onCopyContent,
  onDownload,
  onOpenExternal,
}: DocumentViewerProps) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-12 rounded" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No document selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <DocumentHeader
        fileName={document.name}
        filePath={document.path}
        fileType={document.fileType}
        onClose={onClose}
        onCopyContent={onCopyContent}
        onDownload={onDownload}
        onOpenExternal={onOpenExternal}
      />
      <div className="flex-1 overflow-hidden">
        <DocumentTabs
          content={document.content}
          fileType={document.fileType}
          history={mockHistory}
        />
      </div>
    </div>
  );
};
