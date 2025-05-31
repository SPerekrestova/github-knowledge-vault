import { Repository } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RepoCardProps {
  repo: Repository;
  contentCount: {
    markdown: number;
    mermaid: number;
    postman: number;
  };
  onClick: () => void;
}

export const RepoCard = ({ repo, contentCount, onClick }: RepoCardProps) => {
  const totalContentCount = contentCount.markdown + contentCount.mermaid + contentCount.postman;
  
  return (
    <Card 
      className="cursor-pointer h-full transition-all duration-200 hover:shadow-md border-gray-200 rounded-lg overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="flex items-start justify-between text-lg font-semibold text-gray-800 mb-1">
          <span className="truncate pr-2 leading-snug">{repo.name}</span>
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700">{totalContentCount} items</Badge>
        </CardTitle>
        {repo.description && (
           <CardDescription className="text-sm text-gray-600 line-clamp-2">{repo.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 px-5 py-4">
        {contentCount.markdown > 0 && (
          <Badge variant="outline" className="text-xs font-medium text-blue-800 bg-blue-100 border-blue-300 px-2 py-1 rounded-full">
            {contentCount.markdown} Docs
          </Badge>
        )}
        {contentCount.mermaid > 0 && (
          <Badge variant="outline" className="text-xs font-medium text-green-800 bg-green-100 border-green-300 px-2 py-1 rounded-full">
            {contentCount.mermaid} Diagrams
          </Badge>
        )}
        {contentCount.postman > 0 && (
          <Badge variant="outline" className="text-xs font-medium text-purple-800 bg-purple-100 border-purple-300 px-2 py-1 rounded-full">
            {contentCount.postman} API Collections
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
