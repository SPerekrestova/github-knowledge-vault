import { create } from 'zustand';
import type { AppState, ConversationContext, RightPanelMode, ConnectionStatus } from '@/types';

interface AppStoreState {
  // Selection state
  selectedRepo: string | null;
  selectedFile: string | null;
  selectedConversationId: string | null;

  // UI state
  rightPanelMode: RightPanelMode;
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // Context
  chatContext: ConversationContext | null;

  // Connection
  connectionStatus: ConnectionStatus;

  // Actions
  selectRepo: (repoName: string | null) => void;
  selectFile: (filePath: string | null) => void;
  selectConversation: (conversationId: string | null) => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  setChatContext: (context: ConversationContext | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  // Initial state
  selectedRepo: null,
  selectedFile: null,
  selectedConversationId: null,
  rightPanelMode: 'empty',
  sidebarCollapsed: false,
  rightPanelCollapsed: true,
  chatContext: null,
  connectionStatus: 'connected',

  // Actions
  selectRepo: (repoName) =>
    set((state) => ({
      selectedRepo: repoName,
      rightPanelMode: repoName ? 'browser' : 'empty',
      rightPanelCollapsed: !repoName,
      selectedFile: null,
    })),

  selectFile: (filePath) =>
    set((state) => ({
      selectedFile: filePath,
      rightPanelMode: filePath ? 'document' : state.selectedRepo ? 'browser' : 'empty',
      rightPanelCollapsed: false,
    })),

  selectConversation: (conversationId) =>
    set({ selectedConversationId: conversationId }),

  setRightPanelMode: (mode) =>
    set({ rightPanelMode: mode, rightPanelCollapsed: mode === 'empty' }),

  setChatContext: (context) =>
    set({ chatContext: context }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleRightPanel: () =>
    set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),

  setConnectionStatus: (status) =>
    set({ connectionStatus: status }),
}));
