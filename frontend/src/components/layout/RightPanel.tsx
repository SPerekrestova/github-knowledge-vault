import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RightPanelMode } from '@/types';

interface RightPanelProps {
  mode: RightPanelMode;
  collapsed: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function RightPanel({ mode, collapsed, onClose, children }: RightPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!collapsed && mode !== 'empty') {
      setShouldRender(true);
      // Small delay for animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [collapsed, mode]);

  if (!shouldRender) {
    return null;
  }

  return (
    <aside
      className={cn(
        'w-right-panel bg-card border-l border-border flex flex-col shrink-0',
        'max-w-[600px] min-w-[400px]',
        'transition-all duration-300 ease-out',
        isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-4'
      )}
      role="complementary"
      aria-label={mode === 'browser' ? 'Repository browser' : mode === 'document' ? 'Document viewer' : 'Side panel'}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-end p-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-200 focus-ring"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden animate-fade-in">
        {children}
      </div>
    </aside>
  );
}
