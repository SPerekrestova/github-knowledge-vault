import { useState, useEffect, useRef, useCallback, WheelEvent, MouseEvent } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import mermaid from 'mermaid';

interface DiagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    diagramType: 'mermaid' | 'svg';
    content: string;
    title: string;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;

export const DiagramModal = ({
                                 isOpen,
                                 onClose,
                                 diagramType,
                                 content,
                                 title
                             }: DiagramModalProps) => {
    const [mermaidLoading, setMermaidLoading] = useState(true);
    const [mermaidError, setMermaidError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderedSvg, setRenderedSvg] = useState<string>('');

    // Zoom and pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

    // Reset zoom and position when modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1); // Always start at 100%
            setPosition({ x: 0, y: 0 });
            setMermaidLoading(true);
            setRenderedSvg('');
        }
    }, [isOpen]);

    // Mermaid rendering effect
    useEffect(() => {
        if (isOpen && diagramType === 'mermaid' && content) {
            let cancelled = false;

            const renderDiagram = async () => {
                try {
                    setMermaidLoading(true);
                    setMermaidError(null);

                    const graphId = `mermaid-graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    try {
                        await mermaid.parse(content.trim());
                        const { svg } = await mermaid.render(graphId, content.trim());

                        if (!cancelled) {
                            setRenderedSvg(svg);
                            setMermaidLoading(false);
                        }
                    } catch (error: any) {
                        console.error('Mermaid render error:', error);

                        const element = document.getElementById(graphId);
                        if (element?.parentNode) {
                            element.parentNode.removeChild(element);
                        }

                        if (!cancelled) {
                            setMermaidError(error.message || 'Failed to render diagram');
                            setMermaidLoading(false);
                        }
                    }
                } catch (error: any) {
                    console.error('Error in renderDiagram:', error);
                    if (!cancelled) {
                        setMermaidError(error.message || 'Failed to render diagram');
                        setMermaidLoading(false);
                    }
                }
            };

            renderDiagram();

            return () => {
                cancelled = true;
            };
        }
    }, [isOpen, diagramType, content]);

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const handleReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setScale(prev => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
    }, []);

    // Pan handlers
    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (e.button === 0) { // Left click only
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setLastPosition(position);
            e.preventDefault();
        }
    }, [position]);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            setPosition({
                x: lastPosition.x + deltaX,
                y: lastPosition.y + deltaY
            });
        }
    }, [isDragging, dragStart, lastPosition]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    if (!isOpen) return null;

    const zoomPercentage = Math.round(scale * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-7xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="absolute top-20 right-6 z-10 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
                    <button
                        onClick={handleZoomIn}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Reset zoom (100%)"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    <div className="px-2 py-1 text-xs text-center font-medium text-gray-600 border-t">
                        {zoomPercentage}%
                    </div>
                </div>

                {/* Pan indicator */}
                {scale > 1 && (
                    <div className="absolute top-20 left-6 z-10 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                        <Move className="h-4 w-4 text-gray-600" />
                        <span className="text-xs text-gray-600">Drag to pan</span>
                    </div>
                )}

                {/* Content */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-hidden bg-gray-50 relative"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {diagramType === 'mermaid' ? (
                        <>
                            {mermaidLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Loading diagram...</p>
                                    </div>
                                </div>
                            )}
                            {mermaidError && !mermaidLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50 text-center">
                                        <p className="font-bold">Failed to render diagram</p>
                                        <p className="text-sm mt-2">{mermaidError}</p>
                                    </div>
                                </div>
                            )}
                            {!mermaidLoading && !mermaidError && renderedSvg && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div
                                        style={{
                                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                            transformOrigin: 'center',
                                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                            cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default')
                                        }}
                                        dangerouslySetInnerHTML={{ __html: renderedSvg }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={`data:image/svg+xml;base64,${btoa(content)}`}
                                alt={title}
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'center',
                                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
                                    maxWidth: 'none', // Remove max width constraint
                                    maxHeight: 'none', // Remove max height constraint
                                    width: 'auto',
                                    height: 'auto'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};