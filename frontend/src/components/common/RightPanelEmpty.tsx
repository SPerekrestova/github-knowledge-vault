import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

export function RightPanelEmpty() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <EmptyState
        icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        title="No document selected"
        description="Select a repository from the sidebar to browse documentation, or ask the AI assistant a question."
      />
    </div>
  );
}
