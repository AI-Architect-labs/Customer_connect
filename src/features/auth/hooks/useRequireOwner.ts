import { useAuth } from './useAuth';
import { isOwnerSession } from '../utils/session';

export interface RequireOwnerResult {
  /** True once the initial auth resolution has finished AND the session is an owner. */
  isAuthorized: boolean;
  /** True while the initial auth resolution is still in flight — never trust `isAuthorized` until this is false. */
  isLoading: boolean;
}

/**
 * Returns whether the current session is an authorized owner, without
 * performing any redirect itself — `RequireOwner` (the component) uses this
 * plus a redirect side effect, but a page could also use this hook directly
 * if it needs different behavior (e.g. rendering an inline prompt instead
 * of redirecting).
 */
export function useRequireOwner(): RequireOwnerResult {
  const { session, isLoading } = useAuth();

  return {
    isAuthorized: !isLoading && isOwnerSession(session),
    isLoading,
  };
}
