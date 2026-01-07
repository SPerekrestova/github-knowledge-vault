import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mt-5 mb-3 border-b border-border pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium text-foreground mt-3 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-foreground/90 leading-relaxed mb-4">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-sm text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match ? match[1] : undefined}
                className="my-4"
              />
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-foreground/90">{children}</td>
          ),
          hr: () => <hr className="my-6 border-border" />,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
