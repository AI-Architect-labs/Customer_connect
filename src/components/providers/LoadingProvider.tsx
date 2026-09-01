'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LoadingContextValue {
  isLoading: boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  // A Set of active loading keys, not a single boolean — this is what makes
  // it safe for two unrelated async operations to be in flight at once.
  // If operation A finishes while operation B is still running, the
  // indicator correctly stays visible because B's key is still present.
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const startLoading = useCallback((key: string) => {
    setActiveKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    setActiveKeys((current) => {
      if (!current.has(key)) {
        return current;
      }
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading: activeKeys.size > 0,
      startLoading,
      stopLoading,
    }),
    [activeKeys, startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingIndicator isLoading={value.isLoading} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider.');
  }
  return context;
}

function GlobalLoadingIndicator({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-1 bg-primary/20 transition-opacity duration-200',
        isLoading ? 'opacity-100' : 'opacity-0',
      )}
      role="progressbar"
      aria-hidden={!isLoading}
      aria-label="Loading"
    >
      <div
        className={cn('h-full bg-primary', isLoading && 'animate-loading-bar')}
        style={{ width: isLoading ? '40%' : '0%' }}
      />
    </div>
  );
}
