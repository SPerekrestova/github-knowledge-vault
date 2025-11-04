import yaml from 'js-yaml';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OpenAPIViewerProps {
  content: string;
}

/**
 * OpenAPI specification viewer
 * Displays API information and endpoints table
 */
export const OpenAPIViewer = ({ content }: OpenAPIViewerProps) => {
  let openapiSummary: { title?: string; version?: string; description?: string } = {};
  let parsed: any = null;

  try {
    // Try to parse as JSON, fallback to YAML
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = yaml.load(content);
    }

    if (parsed && typeof parsed === 'object') {
      openapiSummary.title = parsed.info?.title;
      openapiSummary.version = parsed.info?.version;
      openapiSummary.description = parsed.info?.description;
    }
  } catch (error) {
    console.error('Failed to parse OpenAPI spec:', error);
  }

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
                      Object.entries(methods).map(([method, op]: [string, any]) => (
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
            {content}
          </code>
        </pre>
      </TabsContent>
    </Tabs>
  );
};
