
import { useState, useEffect } from 'react';
import { ContentItem, ContentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContentViewerProps {
  contentItem: ContentItem;
}

export const ContentViewer = ({ contentItem }: ContentViewerProps) => {
  const [mermaidLoading, setMermaidLoading] = useState(contentItem.type === 'mermaid');

  useEffect(() => {
    if (contentItem.type === 'mermaid') {
      setMermaidLoading(true);
      
      // In a real app, you would use the mermaid library to render the diagram
      // This is a mock implementation to simulate rendering
      const timer = setTimeout(() => {
        setMermaidLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
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

  const renderContent = () => {
    switch (contentItem.type) {
      case 'markdown':
        return (
          <div className="markdown-content">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(contentItem.content) }} />
          </div>
        );
      
      case 'mermaid':
        return (
          <div className="mermaid-diagram">
            {mermaidLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-500 mb-2">Mermaid Diagram Preview:</div>
                <div className="border p-4 rounded bg-gray-50">
                  <pre className="text-sm overflow-auto">{contentItem.content}</pre>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  In a real implementation, the diagram would be rendered here using the Mermaid library
                </div>
              </>
            )}
          </div>
        );
      
      case 'postman':
        return (
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Postman Collection</h3>
                <div>
                  {tryParsePostman(contentItem.content)}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="json">
              <pre className="border p-4 rounded bg-gray-50 overflow-auto max-h-96 text-sm whitespace-pre-wrap">
                {JSON.stringify(JSON.parse(contentItem.content), null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        );
      
      default:
        return <div>Unsupported content type</div>;
    }
  };

  // Helper function to convert markdown to HTML (simplified)
  const convertMarkdownToHtml = (markdown: string) => {
    let html = markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      // Lists
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<\/li>)(?![\n\r]<li>)/g, '$1</ul>')
      .replace(/(<li>)(?![\n\r]<\/li>)/g, '<ul>$1');
    
    // Replace newlines with <br/> tags
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  // Helper function to parse and display Postman collection preview
  const tryParsePostman = (jsonString: string) => {
    try {
      const postmanData = JSON.parse(jsonString);
      
      return (
        <div>
          <p className="font-medium">Name: {postmanData.info?.name}</p>
          <p className="text-gray-600 mb-4">{postmanData.info?.description}</p>
          
          <h4 className="font-medium mt-2">Requests:</h4>
          <ul className="list-disc pl-6 mt-2">
            {postmanData.item?.map((item: any, index: number) => (
              <li key={index} className="mb-2">
                <span className="font-medium">{item.name}</span>
                <div className="text-sm">
                  {item.request?.method} {item.request?.url}
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    } catch (error) {
      console.error('Failed to parse Postman JSON:', error);
      return <div>Invalid Postman Collection format</div>;
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
