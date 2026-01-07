import { useHealth } from '@/hooks/useHealth';
import { cn } from '@/lib/utils';
import type { WebSocketStatus } from '@/types/connection';

interface ConnectionStatusProps {
  wsStatus?: WebSocketStatus;
  className?: string;
}

export function ConnectionStatus({ wsStatus = 'disconnected', className }: ConnectionStatusProps) {
  const { 
    status,
    isBackendAvailable,
    isMcpConnected,
    isClaudeAvailable,
    cacheItemCount,
  } = useHealth();

  const getStatusConfig = () => {
    if (!isBackendAvailable) {
      return { color: 'bg-destructive', text: 'Offline', animate: false };
    }
    
    switch (status) {
      case 'healthy':
        return { color: 'bg-success', text: 'Connected', animate: true };
      case 'degraded':
        return { color: 'bg-warning', text: 'Degraded', animate: true };
      case 'unhealthy':
        return { color: 'bg-destructive', text: 'Unhealthy', animate: false };
      default:
        return { color: 'bg-muted-foreground', text: 'Unknown', animate: false };
    }
  };

  const getWsStatusText = () => {
    switch (wsStatus) {
      case 'connected':
        return 'WS: ✓';
      case 'connecting':
        return 'WS: ...';
      case 'reconnecting':
        return 'WS: ↻';
      case 'failed':
        return 'WS: ✗';
      default:
        return 'WS: -';
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      {/* Main status */}
      <div className="flex items-center gap-2">
        <span 
          className={cn(
            'w-2 h-2 rounded-full',
            statusConfig.color,
            statusConfig.animate && 'animate-pulse'
          )} 
        />
        <span className="text-muted-foreground">{statusConfig.text}</span>
      </div>

      {/* Service indicators */}
      <div className="flex items-center gap-3 text-muted-foreground">
        {/* MCP Status */}
        <div className="flex items-center gap-1" title="MCP Server">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isMcpConnected ? 'bg-success' : 'bg-muted-foreground/30'
          )} />
          <span className="text-xs">MCP</span>
        </div>

        {/* Claude Status */}
        <div className="flex items-center gap-1" title="Claude API">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isClaudeAvailable ? 'bg-success' : 'bg-muted-foreground/30'
          )} />
          <span className="text-xs">AI</span>
        </div>

        {/* WebSocket Status */}
        <div className="flex items-center gap-1 text-xs" title="WebSocket Connection">
          {getWsStatusText()}
        </div>

        {/* Cache */}
        <div className="text-xs">
          Cache: {cacheItemCount}
        </div>
      </div>
    </div>
  );
}
