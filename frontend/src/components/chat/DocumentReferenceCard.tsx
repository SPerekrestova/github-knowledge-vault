import { FileText } from 'lucide-react';
import type { DocumentReference } from '@/types';

interface DocumentReferenceCardProps {
  reference: DocumentReference;
  onClick?: () => void;
}

export function DocumentReferenceCard({ reference, onClick }: DocumentReferenceCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left w-full"
    >
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{reference.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {reference.repo}/{reference.path}
        </p>
        {reference.snippet && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {reference.snippet}
          </p>
        )}
      </div>
    </button>
  );
}
