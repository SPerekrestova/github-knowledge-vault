import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/types';

interface ToolCallBadgeProps {
  toolCall: ToolCall;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const statusConfig = {
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: Loader2,
    iconClass: 'animate-spin',
  },
  running: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: Loader2,
    iconClass: 'animate-spin',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    icon: CheckCircle2,
    iconClass: '',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    icon: XCircle,
    iconClass: '',
  },
};

const toolNameLabels: Record<string, string> = {
  list_repo_docs: 'Listing documents',
  search_docs: 'Searching documentation',
  read_document: 'Reading document',
  compare_repos: 'Comparing repositories',
};

export function ToolCallBadge({ toolCall, isExpanded, onToggle }: ToolCallBadgeProps) {
  const config = statusConfig[toolCall.status];
  const Icon = config.icon;
  const label = toolNameLabels[toolCall.name] || toolCall.name;

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
          config.bg,
          config.text,
          onToggle && 'cursor-pointer hover:opacity-80'
        )}
      >
        <Icon className={cn('h-3 w-3', config.iconClass)} />
        <span>{label}</span>
        {toolCall.duration && toolCall.status === 'success' && (
          <span className="opacity-70">({toolCall.duration}ms)</span>
        )}
      </button>
      
      {isExpanded && toolCall.result && (
        <div className="ml-2 p-2 bg-muted rounded text-xs font-mono text-muted-foreground max-h-32 overflow-auto">
          {toolCall.result}
        </div>
      )}
      
      {isExpanded && toolCall.error && (
        <div className="ml-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
          {toolCall.error}
        </div>
      )}
    </div>
  );
}
