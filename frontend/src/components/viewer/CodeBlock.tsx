import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock = ({
  code,
  language = 'text',
  showLineNumbers = true,
  className = '',
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map common file extensions to languages
  const languageMap: Record<string, string> = {
    md: 'markdown',
    mmd: 'mermaid',
    yml: 'yaml',
    json: 'json',
    yaml: 'yaml',
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sh: 'bash',
    bash: 'bash',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    sql: 'sql',
  };

  const normalizedLanguage = languageMap[language] || language;

  return (
    <div className={`relative group rounded-lg overflow-hidden ${className}`}>
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      
      {language && (
        <div className="absolute top-2 left-3 z-10 text-xs text-muted-foreground font-mono opacity-60">
          {normalizedLanguage}
        </div>
      )}

      <SyntaxHighlighter
        language={normalizedLanguage}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          padding: '2.5rem 1rem 1rem',
          fontSize: '0.8125rem',
          lineHeight: '1.5',
          borderRadius: '0.5rem',
          background: 'hsl(var(--muted))',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'hsl(var(--muted-foreground))',
          opacity: 0.5,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
