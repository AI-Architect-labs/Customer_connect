import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  setPersistence,
  browserLocalPersistence,
  type User,
  type Unsubscribe,
  type AuthCredential,
  type UserCredential,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { logger } from '@/lib/utils/logger';
import { toAppError, AppError } from '@/lib/utils/errors';

/**
 * Deliberately set explicit persistence rather than relying on the SDK's
 * default — `browserLocalPersistence` keeps a session across full browser
 * restarts (not just tab closes), which matters for both the owner (a
 * repeat, trusted user) and, from Milestone 1.3, the farmer's anonymous/
 * phone-linked session surviving between visits without re-verification.
 *
 * This call is fire-and-forget at module load: Firebase queues auth
 * operations internally until persistence is resolved, so nothing needs to
 * await this before subscribing to auth state below.
 */
setPersistence(auth, browserLocalPersistence).catch((error: unknown) => {
  logger.error('Failed to set Firebase Auth persistence', { error: toAppError(error).message });
});

/**
 * Subscribes to Firebase Auth's own state observer. Returns the
 * unsubscribe function so callers (AuthProvider) can clean up on unmount.
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback, (error) => {
    logger.error('Firebase Auth state observer error', { error: toAppError(error).message });
  });
}

/**
 * Signs an owner in with email/password. Throws a raw FirebaseError on
 * failure — callers (useOwnerLogin) are responsible for mapping that to a
 * user-facing message via authErrors.ts's mapFirebaseAuthError, not this
 * service, which stays a thin wrapper with no UI-facing concerns.
 */
export async function signInWithOwnerCredentials(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out the current session, regardless of which tier it was. Wired to
 * the owner-facing Logout action in the protected owner experience.
 */
export async function signOutCurrentUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Establishes Architecture.md §5.2's Tier 1 identity: a silent, unprompted
 * anonymous session. Idempotent by design — if a session of ANY tier
 * already exists (anonymous, phone-linked, or owner), this is a no-op, so
 * calling it defensively never overwrites or duplicates an existing
 * session. This is what makes "guest session persistence" hold: a farmer
 * returning to the app on the same device keeps the same anonymous UID
 * (and, later, everything tied to it — order history lookups, and the
 * future Sprint 5 cart's association with `createdByUid`) rather than
 * silently getting a fresh, disconnected identity on every visit.
 *
 * `AuthProvider` is the only caller of this in the app — it invokes this
 * exactly once, only when the very first auth-state resolution comes back
 * with no user at all.
 */
export async function signInAnonymouslyIfNeeded(): Promise<void> {
  if (auth.currentUser) {
    return;
  }
  await signInAnonymously(auth);
}

/**
 * The "upgrade path for future OTP login" primitive (Milestone 1.3): links
 * a verified credential (of any type Firebase supports — in practice, a
 * `PhoneAuthCredential`) to the CURRENT session, preserving its existing
 * UID rather than replacing it with a new one. This is what makes Tier 1 →
 * Tier 2 (Architecture.md §5.2) an upgrade, not a fresh sign-in: a farmer's
 * order history and any data already associated with their anonymous UID
 * remains associated with them after linking a phone number.
 *
 * The My Orders phone-verification UI uses the same credential-linking
 * behavior through `completePhoneVerification` below.
 */
export async function linkPhoneCredentialToCurrentUser(
  credential: AuthCredential,
): Promise<UserCredential> {
  if (!auth.currentUser) {
    throw new AppError('No active session to link a phone credential to.', {
      code: 'VALIDATION_ERROR',
    });
  }
  return linkWithCredential(auth.currentUser, credential);
}

export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

export async function requestPhoneVerification(
  phoneNumber: string,
  verifier: RecaptchaVerifier,
): Promise<string> {
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(phoneNumber, verifier);
}

export async function completePhoneVerification(
  verificationId: string,
  code: string,
): Promise<UserCredential> {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  if (!auth.currentUser) {
    return signInWithCredential(auth, credential);
  }
  try {
    return await linkWithCredential(auth.currentUser, credential);
  } catch (error: unknown) {
    const codeValue =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (
      codeValue === 'auth/credential-already-in-use' ||
      codeValue === 'auth/provider-already-linked'
    ) {
      return signInWithCredential(auth, credential);
    }
    throw error;
  }
}
