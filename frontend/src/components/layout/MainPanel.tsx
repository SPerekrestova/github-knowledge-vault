import { ReactNode } from 'react';

interface MainPanelProps {
  children: ReactNode;
}

export function MainPanel({ children }: MainPanelProps) {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-muted/30">
      {children}
    </main>
  );
}
