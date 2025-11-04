import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import { ReactElement } from 'react';

// Import Prism CSS and additional languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';

interface MarkdownViewerProps {
  content: string;
}

/**
 * Markdown content viewer with syntax highlighting
 * Extracted from ContentViewer for better separation of concerns
 */
export const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  // Highlight code blocks after render
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
