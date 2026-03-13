import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatCard({ label, value, delta, icon: Icon, size = 'md', className }: StatCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-1',
        sizeClasses[size],
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn('font-bold text-text-primary', valueSizeClasses[size])}>
          {value}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              'text-sm font-medium mb-0.5',
              delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-text-muted',
            )}
          >
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
