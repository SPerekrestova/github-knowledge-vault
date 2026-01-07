import { CreditCard, Shield, GitCompare, Search, Code, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuggestedPrompt {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

interface SuggestedPromptsProps {
  onPromptClick: (prompt: string) => void;
}

const defaultPrompts: SuggestedPrompt[] = [
  {
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Payment APIs',
    prompt: 'What APIs are available in the payment service?',
  },
  {
    icon: <Shield className="h-4 w-4" />,
    label: 'Authentication',
    prompt: 'How does authentication work?',
  },
  {
    icon: <GitCompare className="h-4 w-4" />,
    label: 'Compare repos',
    prompt: 'Compare auth-service and user-management',
  },
  {
    icon: <Search className="h-4 w-4" />,
    label: 'Search docs',
    prompt: 'Search for error handling documentation',
  },
  {
    icon: <Code className="h-4 w-4" />,
    label: 'API Reference',
    prompt: 'Show me the API reference for the user service',
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    label: 'Getting Started',
    prompt: 'How do I get started with the platform?',
  },
];

export function SuggestedPrompts({ onPromptClick }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {defaultPrompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="gap-2 rounded-full hover:bg-primary/5 hover:border-primary/20"
          onClick={() => onPromptClick(prompt.prompt)}
        >
          {prompt.icon}
          <span>{prompt.label}</span>
        </Button>
      ))}
    </div>
  );
}
