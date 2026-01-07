import { FileText, FileCode, FileJson, Image, File, BookOpen } from 'lucide-react';
import type { FileType } from '@/types';
import { cn } from '@/lib/utils';

interface FileTypeIconProps {
  fileType: FileType;
  className?: string;
}

const iconMap: Record<FileType, React.ComponentType<{ className?: string }>> = {
  markdown: FileText,
  mermaid: BookOpen,
  openapi: FileCode,
  postman: FileJson,
  json: FileJson,
  yaml: FileCode,
  svg: Image,
  unknown: File,
};

const colorMap: Record<FileType, string> = {
  markdown: 'text-file-markdown',
  mermaid: 'text-file-mermaid',
  openapi: 'text-file-openapi',
  postman: 'text-file-postman',
  json: 'text-file-json',
  yaml: 'text-file-yaml',
  svg: 'text-file-svg',
  unknown: 'text-muted-foreground',
};

export function FileTypeIcon({ fileType, className }: FileTypeIconProps) {
  const Icon = iconMap[fileType] || File;
  const colorClass = colorMap[fileType] || 'text-muted-foreground';

  return <Icon className={cn('h-4 w-4', colorClass, className)} />;
}
