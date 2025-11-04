import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Application state management context
 * Separates concerns:
 * - URL: Shareable state (repo, content, type filters)
 * - Context: UI state (sidebar collapsed, view preferences)
 * - LocalStorage: Persistent user preferences
 */

interface AppState {
  // UI State (not in URL)
  sidebarCollapsed: boolean;
  viewMode: 'grid' | 'list';

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'app_sidebar_collapsed',
  VIEW_MODE: 'app_view_mode',
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    return stored ? JSON.parse(stored) : false;
  });

  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (stored as 'grid' | 'list') || 'grid';
  });

  // Persist to localStorage on changes
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(collapsed));
  };

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  const value: AppState = {
    sidebarCollapsed,
    viewMode,
    setSidebarCollapsed,
    setViewMode,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
