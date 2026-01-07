import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', 'N'], description: 'New chat' },
      { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
      { keys: ['⌘', '\\'], description: 'Toggle right panel' },
      { keys: ['Esc'], description: 'Close document / Clear focus' },
    ],
  },
  {
    title: 'Chat',
    shortcuts: [
      { keys: ['⌘', 'Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
    ],
  },
  {
    title: 'Document',
    shortcuts: [
      { keys: ['⌘', 'C'], description: 'Copy content (when selected)' },
      { keys: ['⌘', 'S'], description: 'Download document' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
];

export const KeyboardShortcutsHelp = ({ open, onOpenChange }: KeyboardShortcutsHelpProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick actions to navigate the application efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
