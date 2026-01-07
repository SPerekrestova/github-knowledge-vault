import { useHealth } from '@/hooks/useHealth';
import { LoadingSpinner } from './LoadingSpinner';
import { ConnectionError } from './ConnectionError';
import { Badge } from '@/components/ui/badge';

interface StartupCheckProps {
  children: React.ReactNode;
  /** Show app even if backend is degraded (not fully healthy) */
  allowDegraded?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

export function StartupCheck({
  children,
  allowDegraded = true,
  loadingComponent,
  errorComponent,
}: StartupCheckProps) {
  const { 
    isLoading, 
    isBackendAvailable,
    status,
    error,
    checkNow,
    isMockMode,
  } = useHealth();

  // Loading state (skip in mock mode)
  if (isLoading && !isMockMode) {
    return loadingComponent ?? (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground animate-pulse">
            Connecting to server...
          </p>
        </div>
      </div>
    );
  }

  // Error state - backend not available (skip in mock mode)
  if (!isBackendAvailable && !isMockMode) {
    return errorComponent ?? (
      <ConnectionError
        title="Unable to Connect"
        message={error?.message || 'Could not connect to the backend server.'}
        onRetry={checkNow}
      />
    );
  }

  // Degraded state - show warning but continue (skip in mock mode)
  if (status === 'degraded' && !allowDegraded && !isMockMode) {
    return errorComponent ?? (
      <ConnectionError
        title="Service Degraded"
        message="Some services are not available. Please try again later."
        onRetry={checkNow}
        severity="warning"
      />
    );
  }

  // All good - render app (with mock mode indicator if applicable)
  return (
    <>
      {isMockMode && (
        <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
            Mock Mode
          </Badge>
        </div>
      )}
      {children}
    </>
  );
}
