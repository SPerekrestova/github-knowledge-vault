import { Copy, Download, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileTypeBadge } from '@/components/browser/FileTypeBadge';
import type { FileType } from '@/types';

interface DocumentHeaderProps {
  fileName: string;
  filePath: string;
  fileType: FileType;
  onClose?: () => void;
  onCopyContent?: () => void;
  onDownload?: () => void;
  onOpenExternal?: () => void;
}

export const DocumentHeader = ({
  fileName,
  filePath,
  fileType,
  onClose,
  onCopyContent,
  onDownload,
  onOpenExternal,
}: DocumentHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
      <div className="flex items-center gap-3 min-w-0">
        <FileTypeBadge fileType={fileType} />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{fileName}</h3>
          <p className="text-xs text-muted-foreground truncate">{filePath}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onCopyContent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCopyContent}
            title="Copy content"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {onDownload && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDownload}
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {onOpenExternal && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenExternal}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
