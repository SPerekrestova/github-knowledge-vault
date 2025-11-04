import { Skeleton } from './ui/skeleton';

export const RepositoryCardSkeleton = () => (
  <div className="border rounded-lg p-6 bg-white shadow-sm">
    <Skeleton className="h-6 w-3/4 mb-3" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-4" />
    <div className="flex gap-4 mt-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

export const ContentListItemSkeleton = () => (
  <div className="border rounded-lg p-4 bg-white shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-6 w-24" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

export const RepositoryGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <RepositoryCardSkeleton key={i} />
    ))}
  </div>
);

export const ContentListSkeleton = () => (
  <div className="grid gap-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <ContentListItemSkeleton key={i} />
    ))}
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center w-full px-3 py-2">
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
);
