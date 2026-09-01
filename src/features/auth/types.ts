import type { Owner } from '@/types/owner';

/**
 * The three-tier identity model from Architecture.md §5:
 *   - 'unauthenticated' — no Firebase session at all (transient; Milestone
 *     1.3 makes this effectively never persist for farmers, since it
 *     silently establishes an anonymous session on app load).
 *   - 'anonymous'        — Tier 1: a silent, un-identified farmer session.
 *   - 'phone-linked'      — Tier 2: a farmer session that has verified a
 *     phone number (Milestone 1.3's future-OTP extension).
 *   - 'owner'              — Tier 3: an authenticated owner session, matched
 *     to an `owners/{uid}` Firestore document.
 */
export type SessionTier = 'unauthenticated' | 'anonymous' | 'phone-linked' | 'owner';

/**
 * The fully-resolved session AuthProvider exposes to the rest of the app —
 * combining the raw Firebase Auth identity with the derived tier and (for
 * owners) their Firestore profile.
 */
export interface AuthSession {
  uid: string;
  tier: SessionTier;
  email: string | null;
  phoneNumber: string | null;
  /** Populated only when `tier === 'owner'`. */
  ownerProfile: Owner | null;
}

export interface AuthContextValue {
  /** `null` only while the very first auth-state resolution is in flight, or if truly unauthenticated. */
  session: AuthSession | null;
  /** True only during the initial resolution — never true again after the first callback fires. */
  isLoading: boolean;
  signOut: () => Promise<void>;
}
