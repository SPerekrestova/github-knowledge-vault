import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Paperclip, Lightbulb, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  hint?: string;
}

export function ChatInput({
  onSend,
  onCancel,
  isLoading,
  isDisabled,
  placeholder = 'Ask about your documentation...',
  hint,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (message.trim() && !isLoading && !isDisabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-background border border-border rounded-xl p-2 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Reconnecting...' : placeholder}
            disabled={isLoading || isDisabled}
            className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-24"
            rows={1}
            aria-label="Message input"
          />
          <div className="flex items-center gap-1 absolute right-2 bottom-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-200"
              disabled={isLoading || isDisabled}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            </Button>
            
            {isLoading ? (
              <Button
                onClick={handleCancel}
                size="icon"
                variant="destructive"
                className="h-8 w-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                aria-label="Stop generating"
              >
                <Square className="h-3 w-3 fill-current" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isDisabled}
                size="icon"
                className="h-8 w-8 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>Generating response...</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3" aria-hidden="true" />
                <span>
                  {hint || 'Try: "Compare authentication between auth-service and user-management"'}
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading ? 'Click stop to cancel' : 'Press Enter to send'}
          </span>
        </div>
      </div>
    </div>
  );
}
