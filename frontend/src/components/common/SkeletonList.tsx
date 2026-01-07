import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
  variant?: 'conversation' | 'repository' | 'file' | 'message';
}

export function SkeletonList({
  count = 3,
  className,
  itemClassName,
  variant = 'conversation',
}: SkeletonListProps) {
  const renderItem = (index: number) => {
    switch (variant) {
      case 'conversation':
        return (
          <div key={index} className={cn('flex items-center gap-3 p-3', itemClassName)}>
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        );
      case 'repository':
        return (
          <div key={index} className={cn('flex items-center gap-3 p-3', itemClassName)}>
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        );
      case 'file':
        return (
          <div key={index} className={cn('flex items-center gap-2 p-2', itemClassName)}>
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-8 rounded" />
          </div>
        );
      case 'message':
        return (
          <div key={index} className={cn('space-y-3 p-4', itemClassName)}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="pl-11 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        );
      default:
        return (
          <div key={index} className={cn('p-3', itemClassName)}>
            <Skeleton className="h-4 w-full" />
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-1 animate-pulse', className)}>
      {Array.from({ length: count }).map((_, index) => renderItem(index))}
    </div>
  );
}
