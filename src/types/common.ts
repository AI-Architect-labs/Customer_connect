import type { Timestamp } from 'firebase/firestore';

/**
 * Every `timestamp` field described in Database.md is a native Firestore
 * `Timestamp`, never a plain ISO string or Unix epoch number (Database.md
 * §1, "Canonical timestamp type"). This alias is what every typed field in
 * `src/types/*` should use, so that convention is enforced by the type
 * system rather than only by documentation.
 */
export type FirestoreTimestamp = Timestamp;
