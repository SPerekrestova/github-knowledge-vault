import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { RightPanel } from './RightPanel';
import { useAppStore } from '@/stores/appStore';
import type { Conversation, Repository } from '@/types';

interface AppLayoutProps {
  organizationName: string;
  cacheItemCount: number;
  conversations: Conversation[];
  repositories: Repository[];
  mainContent: ReactNode;
  rightPanelContent?: ReactNode;
  onNewChat: () => void;
  onOpenCommandPalette?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onNavigateHome?: () => void;
  onNavigateRepo?: () => void;
}

export function AppLayout({
  organizationName,
  cacheItemCount,
  conversations,
  repositories,
  mainContent,
  rightPanelContent,
  onNewChat,
  onOpenCommandPalette,
  onOpenKeyboardShortcuts,
  onNavigateHome,
  onNavigateRepo,
}: AppLayoutProps) {
  const {
    selectedConversationId,
    selectedRepo,
    selectedFile,
    rightPanelMode,
    rightPanelCollapsed,
    sidebarCollapsed,
    connectionStatus,
    selectConversation,
    selectRepo,
    toggleRightPanel,
    toggleSidebar,
  } = useAppStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        organizationName={organizationName}
        connectionStatus={connectionStatus}
        cacheItemCount={cacheItemCount}
        selectedRepo={selectedRepo}
        selectedFile={selectedFile}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
        onNavigateHome={onNavigateHome}
        onNavigateRepo={onNavigateRepo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          repositories={repositories}
          selectedConversationId={selectedConversationId}
          selectedRepo={selectedRepo}
          isCollapsed={sidebarCollapsed}
          onNewChat={onNewChat}
          onSelectConversation={selectConversation}
          onSelectRepo={selectRepo}
          onToggleCollapse={toggleSidebar}
        />

        {/* Main Panel */}
        <MainPanel>{mainContent}</MainPanel>

        {/* Right Panel */}
        <RightPanel
          mode={rightPanelMode}
          collapsed={rightPanelCollapsed}
          onClose={toggleRightPanel}
        >
          {rightPanelContent}
        </RightPanel>
      </div>
    </div>
  );
}
