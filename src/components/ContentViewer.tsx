import { useState, useEffect, useRef } from 'react';
import { ContentItem, ContentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import Prism from 'prismjs';

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

export const ContentViewer = ({ contentItem }: ContentViewerProps) => {
  const [mermaidLoading, setMermaidLoading] = useState(contentItem.type === 'mermaid');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

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
      const renderDiagram = async () => {
        try {
          setMermaidLoading(true);
          setMermaidError(null);

          // Validate content
          if (!contentItem.content) {
            throw new Error('No content provided');
          }

          const content = contentItem.content.trim();

          // Clear previous content
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '';
          }

          // Create pre element and use mermaid.run
          const pre = document.createElement('pre');
          pre.className = 'mermaid';
          pre.textContent = content;

          if (mermaidRef.current) {
            mermaidRef.current.appendChild(pre);

            // Run mermaid
            await mermaid.run({
              nodes: [pre],
              suppressErrors: false
            });

            setMermaidLoading(false);
          }

        } catch (error) {
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
      };

      // Execute render
      renderDiagram();
    }
  }, [contentItem]);

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
        return <Badge className="bg-blue-100 text-blue-800">Documentation</Badge>;
      case 'mermaid':
        return <Badge className="bg-green-100 text-green-800">Diagram</Badge>;
      case 'postman':
        return <Badge className="bg-purple-100 text-purple-800">API Collection</Badge>;
      default:
        return null;
    }
  };

  const renderPostmanCollection = (jsonString: string) => {
    try {
      const collection = JSON.parse(jsonString);

      return (
          <div className="space-y-6">
            {/* Collection Info */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold">{collection.info?.name}</h3>
              <p className="text-gray-600">{collection.info?.description}</p>
              {collection.info?.version && (
                  <Badge variant="outline" className="mt-2">v{collection.info.version}</Badge>
              )}
            </div>

            {/* Variables */}
            {collection.variable && collection.variable.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {collection.variable.map((variable: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <span className="font-mono text-purple-600">{variable.key}</span>
                          {variable.value && <span className="ml-2 text-gray-600">= {variable.value}</span>}
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Requests */}
            <div>
              <h4 className="font-medium mb-3">Requests ({collection.item?.length || 0})</h4>
              <div className="space-y-3">
                {collection.item?.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{item.name}</h5>
                        <Badge
                            variant={getMethodVariant(item.request?.method)}
                            className="text-xs"
                        >
                          {item.request?.method || 'GET'}
                        </Badge>
                      </div>

                      {item.request?.url && (
                          <div className="font-mono text-sm bg-gray-100 p-2 rounded mb-2">
                            {typeof item.request.url === 'string'
                                ? item.request.url
                                : item.request.url.raw || item.request.url.host?.join('.') + item.request.url.path?.join('/')
                            }
                          </div>
                      )}

                      {item.request?.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.request.description}</p>
                      )}

                      {/* Headers */}
                      {item.request?.header && item.request.header.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-500">Headers:</span>
                            <div className="mt-1 space-y-1">
                              {item.request.header.map((header: any, headerIndex: number) => (
                                  <div key={headerIndex} className="text-xs font-mono bg-blue-50 p-1 rounded">
                                    {header.key}: {header.value}
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Body */}
                      {item.request?.body && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-500">Body:</span>
                            <div className="mt-1 text-xs font-mono bg-yellow-50 p-2 rounded max-h-20 overflow-y-auto">
                              {item.request.body.raw || JSON.stringify(item.request.body, null, 2)}
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
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                          <pre className={className} {...props}>
                            <code className={className}>
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
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-gray-300">
                            {children}
                          </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium text-left">
                          {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-gray-300 px-4 py-2">
                          {children}
                        </td>
                    ),
                  }}
              >
                {contentItem.content}
              </ReactMarkdown>
            </div>
        );

      case 'mermaid':
        return (
            <div className="mermaid-container">
              {mermaidLoading && (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
              )}
              <div
                  ref={mermaidRef}
                  className="mermaid-wrapper overflow-x-auto"
                  style={{ minHeight: mermaidLoading ? '0' : 'auto' }}
              />
              {mermaidError && (
                  <div className="text-red-500 mt-4">
                    Error: {mermaidError}
                  </div>
              )}
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

      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
      <Card className="shadow-sm content-transition">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{contentItem.name}</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              Last updated: {formatDate(contentItem.lastUpdated)}
            </div>
          </div>
          {renderContentTypeLabel(contentItem.type)}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
  );
};