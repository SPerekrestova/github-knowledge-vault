import { useMermaid } from '@/hooks/useMermaid';
import { Expand } from 'lucide-react';
import { CONSTANTS } from '@/constants';

interface MermaidViewerProps {
  content: string;
  onExpand?: () => void;
}

/**
 * Mermaid diagram viewer with optional fullscreen expand
 * Uses useMermaid hook for proper React state management
 */
export const MermaidViewer = ({ content, onExpand }: MermaidViewerProps) => {
  const { ref, loading, error } = useMermaid({ content });

  return (
    <div className="relative">
      {onExpand && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onExpand}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
            title="View fullscreen"
          >
            <Expand className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )}
      <div className="mermaid-container" style={{ maxWidth: '100%', overflowX: 'auto', padding: 8 }}>
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <div
          ref={ref}
          className="mermaid-wrapper"
          style={{
            minHeight: loading ? '0' : 'auto',
            maxWidth: '100%',
            maxHeight: CONSTANTS.STYLES.MAX_DIAGRAM_HEIGHT,
            overflowX: 'auto',
            overflowY: 'auto'
          }}
        />
        {error && (
          <div className="text-red-500 mt-4">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};
