import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning';
}

export function ConnectionError({
  title,
  message,
  onRetry,
  severity = 'error',
}: ConnectionErrorProps) {
  const isWarning = severity === 'warning';
  
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8">
        {/* Icon */}
        <div className={`
          w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
          ${isWarning ? 'bg-warning/10' : 'bg-destructive/10'}
        `}>
          {isWarning ? (
            <AlertTriangle className="w-8 h-8 text-warning" />
          ) : (
            <X className="w-8 h-8 text-destructive" />
          )}
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-muted-foreground mb-6">
          {message}
        </p>
        
        {/* Actions */}
        <div className="space-y-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant={isWarning ? 'outline' : 'default'}
              className="w-full"
            >
              Try Again
            </Button>
          )}
          
          {/* Help text */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Make sure the backend is running:</p>
            <code className="block p-2 bg-muted rounded text-xs font-mono text-foreground">
              docker-compose up -d
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
