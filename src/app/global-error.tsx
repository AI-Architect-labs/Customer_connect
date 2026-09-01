'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errors';

/**
 * Next.js renders this in place of the ENTIRE root layout (including
 * <html>/<body>) if an error occurs that the layout itself can't recover
 * from — the one category of error the ErrorBoundary component (which lives
 * inside the layout) cannot catch. This is why it's a separate, special
 * Next.js file rather than something composed into AppShell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Fatal error caught by global-error boundary', {
      message: getErrorMessage(error),
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong.</h1>
          <p className="text-base text-muted-foreground">
            We&apos;re sorry for the inconvenience. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}
