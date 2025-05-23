
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
      className="cursor-pointer h-full repo-card"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{repo.name}</span>
          <Badge variant="outline">{totalContentCount} items</Badge>
        </CardTitle>
        <CardDescription>{repo.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {contentCount.markdown > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            {contentCount.markdown} Docs
          </Badge>
        )}
        {contentCount.mermaid > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
            {contentCount.mermaid} Diagrams
          </Badge>
        )}
        {contentCount.postman > 0 && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            {contentCount.postman} API Collections
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
