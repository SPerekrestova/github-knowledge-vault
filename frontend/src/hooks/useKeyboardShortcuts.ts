import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

export const useKeyboardShortcuts = ({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except for specific ones)
      const target = event.target as HTMLElement;
      const isInputFocused = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const metaKey = shortcut.meta ?? false;
        const ctrlKey = shortcut.ctrl ?? false;
        const shiftKey = shortcut.shift ?? false;
        const altKey = shortcut.alt ?? false;

        // Check if the key matches (case-insensitive)
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifier keys
        const modifiersMatch =
          (metaKey === event.metaKey || ctrlKey === event.ctrlKey) &&
          shiftKey === event.shiftKey &&
          altKey === event.altKey;

        // For cmd/ctrl+k type shortcuts, allow even when focused on input
        const isGlobalShortcut = (metaKey || ctrlKey) && shortcut.key.toLowerCase() === 'k';

        if (keyMatches && modifiersMatch && (!isInputFocused || isGlobalShortcut)) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};

// Common keyboard shortcut definitions
export const createShortcutLabel = (shortcut: ShortcutConfig): string => {
  const parts: string[] = [];
  
  // Use ⌘ on Mac, Ctrl on Windows/Linux
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('⇧');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
};
