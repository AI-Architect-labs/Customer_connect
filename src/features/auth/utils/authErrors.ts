import { FirebaseError } from 'firebase/app';

/**
 * Deliberately generic for credential-related failures: 'user-not-found',
 * 'wrong-password', and 'invalid-credential' all map to the SAME message.
 * This is a standard security practice, not an oversight — telling an
 * attacker "that email doesn't exist" vs. "that password is wrong" leaks
 * which part of a guessed credential pair was correct.
 */
const FRIENDLY_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'The email or password you entered is incorrect.',
  'auth/user-not-found': 'The email or password you entered is incorrect.',
  'auth/wrong-password': 'The email or password you entered is incorrect.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — please check your connection and try again.',
};

const DEFAULT_AUTH_ERROR_MESSAGE = 'Something went wrong while signing in. Please try again.';

export function mapFirebaseAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return FRIENDLY_AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_AUTH_ERROR_MESSAGE;
  }
  return DEFAULT_AUTH_ERROR_MESSAGE;
}
