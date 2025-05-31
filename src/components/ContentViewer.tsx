import { useState, useEffect, useRef } from 'react';
import { ContentItem, ContentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import Prism from 'prismjs';
import { ReactElement } from 'react';
import { skippedFiles } from '@/utils/githubService';
import yaml from 'js-yaml';
import { Expand } from 'lucide-react';
import { DiagramModal } from '@/components/DiagramModal';

// Import Prism CSS and additional languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';

interface ContentViewerProps {
  contentItem: ContentItem;
}

let mermaidInitialized = false;
let mermaidDiagramCounter = 0;

// Helper to generate a UUID (uses crypto.randomUUID if available, otherwise fallback)
const getUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const ContentViewer = ({ contentItem }: ContentViewerProps) => {
  const [mermaidLoading, setMermaidLoading] = useState(contentItem.type === 'mermaid');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  // Generate a unique, CSS-safe ID for each diagram instance
  const [uniqueId] = useState(() => {
    mermaidDiagramCounter += 1;
    return `mermaid_diagram_${mermaidDiagramCounter}`;
  });

  // Modal state
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);

  // Initialize Mermaid only once
  useEffect(() => {
    if (!mermaidInitialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          logLevel: 5, // 5 = error level only
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
      } catch (error) {
        console.error('Mermaid initialization failed:', error);
      }
    }
  }, []);

  // Render Mermaid diagrams
  useEffect(() => {
    if (contentItem.type === 'mermaid' && mermaidRef.current) {
      let cancelled = false;
      const renderDiagram = async () => {
        try {
          setMermaidLoading(true);
          setMermaidError(null);
          if (!contentItem.content) {
            console.error('No content provided');
          }
          const content = contentItem.content.trim();
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '';
          }
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(async () => {
            try {
              const id = `mermaid-diagram-${uniqueId}`;
              const { svg } = await mermaid.render(id, content);
              if (!cancelled && mermaidRef.current) {
                mermaidRef.current.innerHTML = svg;
                // Make SVG responsive
                const svgEl = mermaidRef.current.querySelector('svg');
                if (svgEl) {
                  svgEl.removeAttribute('width');
                  svgEl.removeAttribute('height');
                  svgEl.style.width = '100%';
                  svgEl.style.height = 'auto';
                  svgEl.style.maxWidth = '100%';
                  svgEl.style.maxHeight = '400px';
                  svgEl.style.display = 'block';
                }
                setMermaidLoading(false);
              }
            } catch (error) {
              if (!cancelled) {
                console.error('Mermaid rendering error:', error);
                setMermaidError(error.message || 'Failed to render diagram');
                setMermaidLoading(false);
                if (mermaidRef.current) {
                  mermaidRef.current.innerHTML = `
                    <div class="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                      <p class="font-medium">Diagram rendering failed</p>
                      <p class="text-sm mt-1">${error.message}</p>
                      <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">${contentItem.content}</pre>
                    </div>
                  `;
                }
              }
            }
          });
        } catch (error) {
          if (!cancelled) {
            console.error('Mermaid rendering error:', error);
            setMermaidError(error.message || 'Failed to render diagram');
            setMermaidLoading(false);
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `
                <div class="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                  <p class="font-medium">Diagram rendering failed</p>
                  <p class="text-sm mt-1">${error.message}</p>
                  <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">${contentItem.content}</pre>
                </div>
              `;
            }
          }
        }
      };
      renderDiagram();
      // Cleanup on unmount
      return () => {
        cancelled = true;
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '';
        }
      };
    }
  }, [contentItem, uniqueId]);

  // Highlight code blocks after markdown renders
  useEffect(() => {
    if (contentItem.type === 'markdown') {
      Prism.highlightAll();
    }
  }, [contentItem]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'markdown':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-1 rounded-full">Documentation</Badge>;
      case 'mermaid':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1 rounded-full">Diagram</Badge>;
      case 'postman':
      case 'openapi':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs px-2 py-1 rounded-full">API Collection</Badge>;
      default:
        return null;
    }
  };

  const renderPostmanCollection = (jsonString: string) => {
    try {
      const collection = JSON.parse(jsonString);

      return (
          <div className="space-y-6 text-gray-700">
            {/* Collection Info */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">{collection.info?.name}</h3>
              {collection.info?.description && (
                  <div className="prose prose-sm max-w-none text-gray-600 mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {collection.info.description}
                    </ReactMarkdown>
                  </div>
              )}
              {collection.info?.version && (
                  <Badge variant="outline" className="mt-2">v{collection.info.version}</Badge>
              )}
            </div>

            {/* Variables */}
            {collection.variable && collection.variable.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {collection.variable.map((variable: any, index: number) => (
                        <div key={index} className="bg-gray-100 p-3 rounded-md text-sm">
                          <span className="font-mono text-purple-700 font-medium">{variable.key}</span>
                          {variable.value && <span className="ml-2 text-gray-700 break-words">= {variable.value}</span>}
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Requests */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-800">Requests ({collection.item?.length || 0})</h4>
              <div className="space-y-4">
                {collection.item?.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800">{item.name}</h5>
                        <Badge
                            variant={getMethodVariant(item.request?.method)}
                            className="text-xs"
                        >
                          {item.request?.method || 'GET'}
                        </Badge>
                      </div>

                      {item.request?.url && (
                          <div className="font-mono text-sm bg-gray-50 p-3 rounded mb-3 break-all">
                            {typeof item.request.url === 'string'
                                ? item.request.url
                                : item.request.url.raw || item.request.url.host?.join('.') + item.request.url.path?.join('/')
                            }
                          </div>
                      )}

                      {item.request?.description && (
                          <div className="prose prose-sm max-w-none text-gray-600 mb-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.request.description}
                            </ReactMarkdown>
                          </div>
                      )}

                      {/* Headers */}
                      {item.request?.header && item.request.header.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">Headers:</span>
                            <div className="mt-2 space-y-2">
                              {item.request.header.map((header: any, headerIndex: number) => (
                                  <div key={headerIndex} className="text-xs font-mono bg-blue-50 p-2 rounded break-words">
                                    <span className="font-semibold">{header.key}</span>: {header.value}
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Body */}
                      {item.request?.body && (item.request.body.raw || item.request.body.formdata || item.request.body.urlencoded) && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">Body:</span>
                            <div className="mt-2 text-xs font-mono bg-yellow-50 p-3 rounded max-h-40 overflow-y-auto break-all">
                              {item.request.body.raw || JSON.stringify(item.request.body, null, 2)}
                            </div>
                          </div>
                      )}

                      {/* Responses with markdown description */}
                      {item.response && Array.isArray(item.response) && item.response.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">Responses:</span>
                            <div className="mt-2 space-y-3">
                              {item.response.map((resp: any, respIdx: number) => (
                                  <div key={respIdx} className="border rounded bg-gray-100 p-3">
                                    <div className="font-mono text-sm text-purple-800 font-semibold mb-2">{resp.name || resp.code || 'Response'}</div>
                                    {resp.description && (
                                        <div className="prose prose-xs max-w-none text-gray-600">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {resp.description}
                                          </ReactMarkdown>
                                        </div>
                                    )}
                                    {resp.body && (
                                        <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded max-h-20 overflow-y-auto break-all">
                                          {typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body, null, 2)}
                                        </div>
                                    )}
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
          </div>
      );
    } catch (error) {
      console.error('Failed to parse Postman collection:', error);
      return (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            <p className="font-medium">Invalid Postman Collection</p>
            <p className="text-sm mt-1">The JSON format is invalid or corrupted.</p>
          </div>
      );
    }
  };

  const getMethodVariant = (method: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'default';
      case 'POST':
        return 'secondary';
      case 'PUT':
        return 'outline';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderContent = () => {
    switch (contentItem.type) {
      case 'markdown':
        return (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: {
                      node: any;
                      inline?: boolean;
                      className?: string;
                      children: React.ReactNode;
                    } & React.HTMLAttributes<HTMLElement>): ReactElement {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                          <pre className="p-4 rounded-md bg-gray-100 text-sm overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                      ) : (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                      );
                    },
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-300">
                            {children}
                          </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left text-sm">
                          {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {children}
                        </td>
                    ),
                    // Add more component overrides for other markdown elements like headings, lists, etc. if needed
                  }}
              >
                {contentItem.content}
              </ReactMarkdown>
            </div>
        );

      case 'mermaid':
        return (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                    onClick={() => setIsDiagramModalOpen(true)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                    title="View fullscreen"
                >
                  <Expand className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="mermaid-container" style={{ maxWidth: '100%', overflowX: 'auto', padding: 8 }}>
                {mermaidLoading && (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}
                <div
                    ref={mermaidRef}
                    className="mermaid-wrapper"
                    id={`mermaid-container-${uniqueId}`}
                    style={{ minHeight: mermaidLoading ? '0' : 'auto', maxWidth: '100%', maxHeight: 400, overflowX: 'auto', overflowY: 'auto' }}
                />
                {mermaidError && (
                    <div className="text-red-500 mt-4">
                      Error: {mermaidError}
                    </div>
                )}
              </div>
            </div>
        );

      case 'svg':
        // Render SVG as an <img> using data URL
        return (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                    onClick={() => setIsDiagramModalOpen(true)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                    title="View fullscreen"
                >
                  <Expand className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="flex justify-center items-center">
                <img
                    src={`data:image/svg+xml;base64,${btoa(contentItem.content)}`}
                    alt={contentItem.name}
                    style={{ maxWidth: '100%', maxHeight: 400, display: 'block' }}
                />
              </div>
            </div>
        );

      case 'postman':
        return (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                {renderPostmanCollection(contentItem.content)}
              </TabsContent>
              <TabsContent value="json">
              <pre className="border p-4 rounded bg-gray-50 overflow-auto max-h-96 text-sm">
                <code className="language-json">
                  {JSON.stringify(JSON.parse(contentItem.content), null, 2)}
                </code>
              </pre>
              </TabsContent>
            </Tabs>
        );

      case 'openapi':
        // Render OpenAPI as a tabbed interface: summary and raw YAML/JSON
        let openapiSummary: { title?: string; version?: string; description?: string } = {};
        let parsed: any = null;
        try {
          // Try to parse as JSON, fallback to YAML
          try {
            parsed = JSON.parse(contentItem.content);
          } catch {
            parsed = yaml.load(contentItem.content);
          }
          if (parsed && typeof parsed === 'object') {
            openapiSummary.title = parsed.info?.title;
            openapiSummary.version = parsed.info?.version;
            openapiSummary.description = parsed.info?.description;
          }
        } catch {}
        return (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-lg">{openapiSummary.title || 'OpenAPI Spec'}</div>
                    {openapiSummary.version && <div className="text-sm text-gray-500">Version: {openapiSummary.version}</div>}
                    {openapiSummary.description && <div className="text-gray-700 mt-2">{openapiSummary.description}</div>}
                    {!(openapiSummary.title || openapiSummary.version || openapiSummary.description) && (
                        <div className="text-gray-500">No summary info found in OpenAPI spec.</div>
                    )}
                  </div>
                  {/* Endpoints Table */}
                  {parsed && parsed.paths && typeof parsed.paths === 'object' && Object.keys(parsed.paths).length > 0 && (
                      <div>
                        <div className="font-semibold text-base mb-2 mt-4">Endpoints</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-200 text-sm">
                            <thead>
                            <tr className="bg-gray-50">
                              <th className="border px-2 py-1 text-left">Method</th>
                              <th className="border px-2 py-1 text-left">Path</th>
                              <th className="border px-2 py-1 text-left">Summary</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(parsed.paths).map(([path, methods]: [string, any]) =>
                                Object.entries(methods).map(([method, op]: [string, any], idx: number) => (
                                    <tr key={path + method} className="even:bg-gray-50">
                                      <td className="border px-2 py-1 font-mono uppercase text-xs text-blue-700">{method}</td>
                                      <td className="border px-2 py-1 font-mono">{path}</td>
                                      <td className="border px-2 py-1">{op.summary || op.description || <span className="text-gray-400">No summary</span>}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="raw">
              <pre className="border p-4 rounded bg-gray-50 overflow-auto max-h-96 text-sm">
                <code className="language-yaml">
                  {contentItem.content}
                </code>
              </pre>
              </TabsContent>
            </Tabs>
        );

      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
      <>
        <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-800">{contentItem.name}</CardTitle>
            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
              {contentItem.lastUpdated && (
                  <span>Updated {formatDate(contentItem.lastUpdated)}</span>
              )}
              {renderContentTypeLabel(contentItem.type)}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Diagram Modal */}
        {(contentItem.type === 'mermaid' || contentItem.type === 'svg') && (
            <DiagramModal
                isOpen={isDiagramModalOpen}
                onClose={() => setIsDiagramModalOpen(false)}
                diagramType={contentItem.type}
                content={contentItem.content}
                title={contentItem.name}
            />
        )}
      </>
  );
};