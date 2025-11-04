import { Expand } from 'lucide-react';
import { CONSTANTS } from '@/constants';

interface SVGViewerProps {
  content: string;
  name: string;
  onExpand?: () => void;
}

/**
 * SVG image viewer with optional fullscreen expand
 */
export const SVGViewer = ({ content, name, onExpand }: SVGViewerProps) => {
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
      <div className="flex justify-center items-center">
        <img
          src={`data:image/svg+xml;base64,${btoa(content)}`}
          alt={name}
          style={{
            maxWidth: '100%',
            maxHeight: CONSTANTS.STYLES.MAX_DIAGRAM_HEIGHT,
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};
