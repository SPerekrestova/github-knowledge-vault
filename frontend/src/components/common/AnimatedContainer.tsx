import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale-in';
  delay?: number;
  duration?: number;
}

export function AnimatedContainer({
  children,
  className,
  animation = 'fade-in',
  delay = 0,
  duration = 300,
}: AnimatedContainerProps) {
  const animationClass = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-down': 'animate-slide-down',
    'slide-left': 'animate-slide-left',
    'slide-right': 'animate-slide-right',
    'scale-in': 'animate-scale-in',
  }[animation];

  return (
    <div
      className={cn(animationClass, className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
