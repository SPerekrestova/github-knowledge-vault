import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';

export const MCPStatusIndicator = () => {
  const { data: health } = useQuery({
    queryKey: ['mcp-health'],
    queryFn: () => mcpService.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  const isConnected = health?.mcp_connected ?? false;
  const cacheSize = health?.cache_size ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className="text-xs"
      >
        {isConnected ? '🔌 MCP Connected' : '⚠️ MCP Disconnected'}
      </Badge>

      {isConnected && (
        <span className="text-xs text-muted-foreground">
          Cache: {cacheSize} items
        </span>
      )}
    </div>
  );
};
