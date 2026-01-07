import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Eye, Code, History } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CodeBlock } from './CodeBlock';
import type { FileType } from '@/types';

interface HistoryEntry {
  version: string;
  date: Date;
  author?: string;
  message?: string;
}

interface DocumentTabsProps {
  content: string;
  fileType: FileType;
  history?: HistoryEntry[];
  defaultTab?: 'preview' | 'raw' | 'history';
}

export const DocumentTabs = ({
  content,
  fileType,
  history = [],
  defaultTab = 'preview',
}: DocumentTabsProps) => {
  // Determine language from file type
  const getLanguage = (type: FileType): string => {
    switch (type) {
      case 'markdown':
        return 'markdown';
      case 'mermaid':
        return 'mermaid';
      case 'openapi':
      case 'yaml':
        return 'yaml';
      case 'json':
      case 'postman':
        return 'json';
      default:
        return 'text';
    }
  };

  // Check if file type supports preview
  const supportsPreview = ['markdown'].includes(fileType);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Tabs defaultValue={supportsPreview ? defaultTab : 'raw'} className="h-full flex flex-col">
      <div className="border-b border-border px-4">
        <TabsList className="bg-transparent h-10 gap-1">
          {supportsPreview && (
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground gap-1.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          )}
          <TabsTrigger
            value="raw"
            className="data-[state=active]:bg-muted data-[state=active]:text-foreground gap-1.5 text-xs"
          >
            <Code className="h-3.5 w-3.5" />
            Raw
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-muted data-[state=active]:text-foreground gap-1.5 text-xs"
          >
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-auto">
        {supportsPreview && (
          <TabsContent value="preview" className="m-0 p-4 h-full">
            <MarkdownRenderer content={content} />
          </TabsContent>
        )}

        <TabsContent value="raw" className="m-0 p-4 h-full">
          <CodeBlock
            code={content}
            language={getLanguage(fileType)}
            showLineNumbers={true}
          />
        </TabsContent>

        <TabsContent value="history" className="m-0 p-4 h-full">
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div
                  key={entry.version}
                  className={`p-3 rounded-lg border ${
                    index === 0
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-primary">
                      {entry.version}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                    {entry.author && ` • ${entry.author}`}
                  </p>
                  {entry.message && (
                    <p className="text-sm text-foreground/80 mt-1">
                      {entry.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <History className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No version history available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                History tracking is not enabled for this document
              </p>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
