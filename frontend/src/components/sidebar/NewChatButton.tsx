import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewChatButtonProps {
  onClick: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <div className="p-4 border-b border-border">
      <Button
        onClick={onClick}
        className="w-full bg-primary hover:bg-primary-600 text-primary-foreground font-medium transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>
    </div>
  );
}
