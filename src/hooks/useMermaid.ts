import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { CONSTANTS } from '@/constants';

/**
 * Custom hook for rendering Mermaid diagrams
 *
 * Fixes issues with module-level state in ContentViewer:
 * - Proper React state management
 * - Automatic cleanup on unmount
 * - Unique IDs per hook instance
 * - No shared state between diagrams
 */

interface UseMermaidOptions {
  content: string;
  enabled?: boolean;
}

interface UseMermaidResult {
  ref: React.RefObject<HTMLDivElement>;
  loading: boolean;
  error: string | null;
}

// Track mermaid initialization per hook
let mermaidInitialized = false;

export const useMermaid = ({ content, enabled = true }: UseMermaidOptions): UseMermaidResult => {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<string>(`mermaid-${Math.random().toString(36).substring(2)}-${Date.now()}`);

  useEffect(() => {
    // Initialize mermaid once globally
    if (!mermaidInitialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          logLevel: 5, // Error level only
          flowchart: {
            htmlLabels: true,
            curve: 'basis'
          },
          themeVariables: {
            primaryColor: '#f3f4f6',
            primaryTextColor: '#111827',
            primaryBorderColor: '#d1d5db',
            lineColor: '#6b7280',
            secondaryColor: '#e5e7eb',
            tertiaryColor: '#f9fafb'
          }
        });
        mermaidInitialized = true;
      } catch (initError) {
        console.error('Mermaid initialization failed:', initError);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current || !content) {
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        setLoading(true);
        setError(null);

        const trimmedContent = content.trim();
        if (!trimmedContent) {
          throw new Error('No content provided');
        }

        // Clear previous content
        if (ref.current) {
          ref.current.innerHTML = '';
        }

        // Use requestAnimationFrame to ensure DOM is ready
        await new Promise(resolve => requestAnimationFrame(resolve));

        if (cancelled || !ref.current) {
          return;
        }

        // Render the diagram
        const id = idRef.current;
        const { svg } = await mermaid.render(id, trimmedContent);

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;

          // Make SVG responsive
          const svgEl = ref.current.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.maxWidth = '100%';
            svgEl.style.maxHeight = CONSTANTS.STYLES.MAX_DIAGRAM_HEIGHT;
            svgEl.style.display = 'block';
          }

          setLoading(false);
        }
      } catch (renderError: any) {
        if (!cancelled) {
          console.error('Mermaid rendering error:', renderError);
          const errorMessage = renderError.message || 'Failed to render diagram';
          setError(errorMessage);
          setLoading(false);

          // Display error in the container
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                <p class="font-medium">Diagram rendering failed</p>
                <p class="text-sm mt-1">${errorMessage}</p>
                <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">${content}</pre>
              </div>
            `;
          }
        }
      }
    };

    renderDiagram();

    // Cleanup on unmount or content change
    return () => {
      cancelled = true;
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, [content, enabled]);

  return {
    ref,
    loading,
    error
  };
};
