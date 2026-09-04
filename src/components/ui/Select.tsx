import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring',
          className,
        )}
        {...props}
      />
    );
  },
);
