import type { FileType } from '@/types';
import { cn } from '@/lib/utils';

interface FileTypeBadgeProps {
  fileType: FileType;
  className?: string;
}

const labelMap: Record<FileType, string> = {
  markdown: 'MD',
  mermaid: 'MMD',
  openapi: 'OAS',
  postman: 'PM',
  json: 'JSON',
  yaml: 'YAML',
  svg: 'SVG',
  unknown: 'FILE',
};

const colorMap: Record<FileType, string> = {
  markdown: 'bg-file-markdown/20 text-file-markdown',
  mermaid: 'bg-file-mermaid/20 text-file-mermaid',
  openapi: 'bg-file-openapi/20 text-file-openapi',
  postman: 'bg-file-postman/20 text-file-postman',
  json: 'bg-file-json/20 text-file-json',
  yaml: 'bg-file-yaml/20 text-file-yaml',
  svg: 'bg-file-svg/20 text-file-svg',
  unknown: 'bg-muted text-muted-foreground',
};

export function FileTypeBadge({ fileType, className }: FileTypeBadgeProps) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
        colorMap[fileType] || colorMap.unknown,
        className
      )}
    >
      {labelMap[fileType] || 'FILE'}
    </span>
  );
}
