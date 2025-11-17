import { Button } from '@/components/ui/button';
import { mcpService } from '@/utils/mcpService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const ClearCacheButton = () => {
  const queryClient = useQueryClient();

  const handleClearCache = async () => {
    try {
      // Clear MCP Bridge cache
      await mcpService.clearCache();

      // Clear React Query cache
      queryClient.invalidateQueries();

      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
      console.error(error);
    }
  };

  return (
    <Button onClick={handleClearCache} variant="outline" size="sm">
      🗑️ Clear Cache
    </Button>
  );
};
