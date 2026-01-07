import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Repository } from '@/types';

interface SidebarFooterProps {
  repositories: Repository[];
}

export function SidebarFooter({ repositories }: SidebarFooterProps) {
  const totalDocs = repositories.reduce((acc, r) => acc + r.documentCount, 0);

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>
            {repositories.length} repos • {totalDocs} docs indexed
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="hover:text-foreground transition-colors">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align="end">
            <p>Documentation is synced in real-time from your GitHub repositories.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
