import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'p-4',
    iconWrapper: 'w-10 h-10 mb-2',
    icon: 'h-5 w-5',
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'p-8',
    iconWrapper: 'w-16 h-16 mb-4',
    icon: 'h-8 w-8',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'p-12',
    iconWrapper: 'w-20 h-20 mb-6',
    icon: 'h-10 w-10',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center animate-fade-in',
        sizes.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className={cn(
        'rounded-full bg-muted flex items-center justify-center',
        sizes.iconWrapper
      )}>
        {icon || <FileText className={cn('text-muted-foreground', sizes.icon)} aria-hidden="true" />}
      </div>
      <h3 className={cn('font-semibold text-foreground mb-2', sizes.title)}>{title}</h3>
      <p className={cn('text-muted-foreground max-w-sm', sizes.description)}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
