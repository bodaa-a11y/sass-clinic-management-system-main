'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-8 h-8',
      title: 'text-sm',
      description: 'text-xs',
      button: 'text-xs',
    },
    md: {
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-sm',
      button: 'text-sm',
    },
    lg: {
      icon: 'w-24 h-24',
      title: 'text-xl',
      description: 'text-base',
      button: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 text-gray-300">
          <Icon className={classes.icon} />
        </div>
      )}
      <h3 className={cn('font-medium text-gray-900 mb-2', classes.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-gray-500 mb-4', classes.description)}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            'px-4 py-2 bg-medical-blue text-white rounded-lg hover:bg-blue-700 transition-colors',
            classes.button
          )}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
