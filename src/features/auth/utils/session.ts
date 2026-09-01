import type { User } from 'firebase/auth';
import type { Owner } from '@/types/owner';
import type { AuthSession, SessionTier } from '../types';

/**
 * Determines which of the four session tiers (Architecture.md §5) a given
 * Firebase User + (possibly null) Owner profile represents. Pure and
 * side-effect-free by design, so it can be unit-tested with plain objects
 * — no Firebase SDK or emulator required.
 */
export function determineSessionTier(user: User | null, ownerProfile: Owner | null): SessionTier {
  if (!user) {
    return 'unauthenticated';
  }
  if (ownerProfile) {
    return 'owner';
  }
  if (user.isAnonymous) {
    return 'anonymous';
  }
  if (user.phoneNumber) {
    return 'phone-linked';
  }
  // A non-anonymous, non-phone, non-owner user shouldn't occur in this
  // app's identity model (Architecture.md §5 defines only these three
  // authenticated shapes) — treated as unauthenticated rather than
  // silently trusted, since falling through to a wrong tier could grant
  // unintended access.
  return 'unauthenticated';
}

/**
 * Builds the full AuthSession the rest of the app consumes, from the raw
 * Firebase User and the Owner profile lookup result.
 */
export function buildAuthSession(
  user: User | null,
  ownerProfile: Owner | null,
): AuthSession | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    tier: determineSessionTier(user, ownerProfile),
    email: user.email,
    phoneNumber: user.phoneNumber,
    ownerProfile,
  };
}

export function isOwnerSession(session: AuthSession | null): boolean {
  return session?.tier === 'owner';
}

export function isAnonymousSession(session: AuthSession | null): boolean {
  return session?.tier === 'anonymous';
}

export function isPhoneLinkedSession(session: AuthSession | null): boolean {
  return session?.tier === 'phone-linked';
}
