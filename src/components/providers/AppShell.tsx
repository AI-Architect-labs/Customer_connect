'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LoadingProvider } from '@/components/providers/LoadingProvider';
import { AuthProvider } from '@/features/auth';
import { PwaProvider } from '@/components/providers/PwaProvider';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

/**
 * The Application Shell composes every cross-cutting provider around the
 * app's content, in a fixed, deliberate order:
 *
 *   ErrorBoundary   — outermost, so it can catch errors from the providers
 *                      themselves, not just from page content.
 *     AuthProvider    — resolves the session (Architecture.md §5) before
 *                      anything else renders; every other provider and all
 *                      page content can safely assume auth state is
 *                      available (even if still `isLoading`).
 *       LoadingProvider — global loading indicator.
 *         ToastProvider — toast/snackbar viewport, innermost so a toast
 *                         triggered from anywhere renders on top of everything.
 *
 * Route-specific navigation shells (the Farmer bottom-tab shell, the Owner
 * sidebar shell — Architecture.md §2.1) are added in their own route groups
 * once those routes exist (Sprint 4+); this shell is the one thing every
 * route, in both experiences, shares.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LoadingProvider>
          <ToastProvider><PwaProvider><OfflineBanner />{children}</PwaProvider></ToastProvider>
        </LoadingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
