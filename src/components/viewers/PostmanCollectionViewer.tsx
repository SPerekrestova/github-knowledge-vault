import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostmanCollectionViewerProps {
  content: string;
}

/**
 * Postman API collection viewer
 * Displays collection info, variables, and requests with responses
 */
export const PostmanCollectionViewer = ({ content }: PostmanCollectionViewerProps) => {
  // Parse collection once and memoize (avoids double parsing in tabs)
  const parsedCollection = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse Postman collection:', error);
      return null;
    }
  }, [content]);

  const renderPostmanCollection = (collection: any) => {
    if (!collection) {
      return (
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
          <p className="font-medium">Invalid Postman Collection</p>
          <p className="text-sm mt-1">The JSON format is invalid or corrupted.</p>
        </div>
      );
    }

    try {

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

                  {/* Responses */}
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
      console.error('Failed to render Postman collection:', error);
      return (
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
          <p className="font-medium">Error Rendering Collection</p>
          <p className="text-sm mt-1">An error occurred while rendering the collection.</p>
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

  return (
    <Tabs defaultValue="preview" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="json">Raw JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        {renderPostmanCollection(parsedCollection)}
      </TabsContent>
      <TabsContent value="json">
        <pre className="border p-4 rounded bg-gray-50 overflow-auto max-h-96 text-sm">
          <code className="language-json">
            {parsedCollection ? JSON.stringify(parsedCollection, null, 2) : 'Invalid JSON'}
          </code>
        </pre>
      </TabsContent>
    </Tabs>
  );
};
