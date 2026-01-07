import { Bot } from 'lucide-react';
import { SuggestedPrompts } from './SuggestedPrompts';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
        <Bot className="h-10 w-10 text-white" />
      </div>
      
      {/* Heading */}
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        How can I help you today?
      </h2>
      
      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8">
        I can help you explore your organization's documentation, find API references,
        compare repositories, and answer questions about your codebase.
      </p>
      
      {/* Suggested Prompts */}
      <SuggestedPrompts onPromptClick={onPromptClick} />
    </div>
  );
}
