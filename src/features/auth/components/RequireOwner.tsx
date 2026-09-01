'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireOwner } from '../hooks/useRequireOwner';

export interface RequireOwnerProps {
  children: ReactNode;
  /**
   * Where to redirect an unauthorized session. Defaults to '/login', which
   * does not exist as a real route until Milestone 1.2 builds the owner
   * login screen — passing an explicit `redirectTo` is recommended until
   * then if a route wraps its content in this component.
   */
  redirectTo?: string;
  /** Rendered while the initial auth resolution is in flight. Defaults to a minimal, unstyled placeholder. */
  loadingFallback?: ReactNode;
}

/**
 * Wraps owner-only content, redirecting any non-owner session (including
 * a still-resolving one) to `redirectTo`. This is a client-side guard, by
 * design (Architecture.md §9's "no custom backend" principle) — Firebase
 * Security Rules remain the actual authorization boundary (Database.md
 * §7); this component only prevents an unauthorized UI from flashing on
 * screen, it never substitutes for a rule.
 */
export function RequireOwner({
  children,
  redirectTo = '/login',
  loadingFallback = null,
}: RequireOwnerProps) {
  const { isAuthorized, isLoading } = useRequireOwner();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthorized, redirectTo, router]);

  if (isLoading || !isAuthorized) {
    return loadingFallback;
  }

  return children;
}
