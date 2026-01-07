import { Github, Building2, Settings, Search, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import type { ConnectionStatus as ConnectionStatusType } from '@/types';

interface HeaderProps {
  organizationName: string;
  connectionStatus: ConnectionStatusType;
  cacheItemCount: number;
  selectedRepo?: string | null;
  selectedFile?: string | null;
  onSettingsClick?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onNavigateHome?: () => void;
  onNavigateRepo?: () => void;
}

export function Header({
  organizationName,
  connectionStatus,
  cacheItemCount,
  selectedRepo,
  selectedFile,
  onSettingsClick,
  onOpenCommandPalette,
  onOpenKeyboardShortcuts,
  onNavigateHome,
  onNavigateRepo,
}: HeaderProps) {
  return (
    <header className="h-header bg-card border-b border-border px-4 flex items-center justify-between shrink-0">
      {/* Left: Logo and Organization */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-file-mermaid rounded-lg flex items-center justify-center">
            <Github className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">Knowledge Vault</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          {organizationName}
        </span>
        
        {/* Breadcrumbs */}
        {(selectedRepo || selectedFile) && (
          <>
            <span className="text-muted-foreground">|</span>
            <Breadcrumbs
              repoName={selectedRepo}
              filePath={selectedFile}
              onNavigateHome={onNavigateHome}
              onNavigateRepo={onNavigateRepo}
            />
          </>
        )}
      </div>

      {/* Right: Search, Status and Settings */}
      <div className="flex items-center gap-2">
        {/* Command Palette Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </Button>
        
        <ConnectionStatus className="hidden md:flex" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenKeyboardShortcuts}
          className="text-muted-foreground hover:text-foreground"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
