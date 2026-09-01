'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastOptions {
  type: ToastType;
  message: string;
  /** Optional action label + handler, e.g. "Retry" on an error toast (UI_UX.md §21.2). */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Auto-dismiss durations per UI_UX.md §21.1/21.2/21.3 — warnings never
// auto-dismiss on their own, since they require a conscious user choice.
const AUTO_DISMISS_MS: Record<ToastType, number | null> = {
  success: 3500,
  error: 6000,
  warning: null,
};

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    // A new toast always replaces the current one rather than stacking
    // (UI_UX.md §21.5), so any pending auto-dismiss timer is cleared first.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const id = nextToastId++;
    setToast({ id, ...options });

    const duration = AUTO_DISMISS_MS[options.type];
    if (duration !== null) {
      timeoutRef.current = setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timeoutRef.current = null;
      }, duration);
    }
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-success text-success-foreground',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning text-warning-foreground',
};

function ToastViewport({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  if (!toast) {
    return null;
  }

  // Errors are announced assertively (interrupting), since the user must be
  // made aware regardless of where their focus currently is. Success and
  // warning toasts use a polite announcement (UI_UX.md §19.7).
  const isAssertive = toast.type === 'error';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      aria-live={isAssertive ? 'assertive' : 'polite'}
      role={isAssertive ? 'alert' : 'status'}
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium shadow-lg',
          TOAST_STYLES[toast.type],
        )}
      >
        <span>{toast.message}</span>
        <div className="flex shrink-0 items-center gap-3">
          {toast.action && (
            <button
              type="button"
              onClick={toast.action.onClick}
              className="rounded underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded text-lg leading-none opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
