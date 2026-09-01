'use client';

import { useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { AuthContext } from '../context';
import type { AuthContextValue, AuthSession } from '../types';
import {
  subscribeToAuthChanges,
  signOutCurrentUser,
  signInAnonymouslyIfNeeded,
} from '../services/authService';
import { buildAuthSession } from '../utils/session';
import { getOwnerByUid } from '@/lib/repositories/ownerRepository';
import { logger } from '@/lib/utils/logger';
import { toAppError } from '@/lib/utils/errors';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guards against attempting anonymous sign-in more than once per mount,
  // even if onAuthStateChanged were to fire with `null` more than once
  // (e.g. after a sign-out elsewhere) — silent Tier 1 identity is
  // established at most once automatically; a deliberate sign-out is never
  // immediately re-upgraded back to anonymous without a fresh page load.
  const hasAttemptedAnonymousSignIn = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    const unsubscribe = subscribeToAuthChanges(async (user: User | null) => {
      if (!user) {
        if (!hasAttemptedAnonymousSignIn.current) {
          hasAttemptedAnonymousSignIn.current = true;
          try {
            // Fires a follow-up onAuthStateChanged callback with the new
            // anonymous user on success — this callback intentionally does
            // NOT set session/isLoading itself; resolution happens on that
            // follow-up call, via the normal path below.
            await signInAnonymouslyIfNeeded();
          } catch (error) {
            logger.error('Silent anonymous sign-in failed', {
              error: toAppError(error).message,
            });
            if (isCurrent) {
              setSession(null);
              setIsLoading(false);
            }
          }
          return;
        }

        // Anonymous sign-in was already attempted and still no user exists
        // (it failed) — resolve as unauthenticated rather than hang.
        if (isCurrent) {
          setSession(null);
          setIsLoading(false);
        }
        return;
      }

      // A Firestore permission error here (e.g. before the owners/{uid}
      // rule matches, or a genuine network failure) must not crash the
      // whole app's auth resolution — it's treated as "not an owner"
      // rather than left unhandled, since a farmer's anonymous/phone-linked
      // session has no owner document by definition and should resolve
      // normally regardless of any Firestore error.
      let ownerProfile = null;
      const couldBeOwner = !user.isAnonymous && user.providerData.some((provider) => provider.providerId === 'password');
      if (couldBeOwner) {
        try {
          ownerProfile = await getOwnerByUid(user.uid);
        } catch (error) {
          logger.warn('Owner profile lookup failed during auth resolution', {
            uid: user.uid,
            error: toAppError(error).message,
          });
        }
      }

      if (isCurrent) {
        setSession(buildAuthSession(user, ownerProfile));
        setIsLoading(false);
      }
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signOut: signOutCurrentUser,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
