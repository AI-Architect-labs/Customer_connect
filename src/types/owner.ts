import type { FirestoreTimestamp } from './common';

/**
 * Mirrors Database.md §3.6 — `owners/{ownerUid}`. The document ID is the
 * Firebase Auth UID itself (no separate `createdBy`/`updatedBy`/`deletedAt`
 * fields — Database.md §3.6 explains why these don't apply to this
 * collection: it's self-created by the owner and not soft-deletable in V1).
 */
export interface Owner {
  /** The shop this owner manages. Single value in V1 (Database.md §10 notes the future multi-shop extension). */
  shopId: string;
  email: string;
  displayName: string;
  /** Fixed to "owner" in V1; reserved for future role differentiation (e.g. "staff"). */
  role: 'owner';
  createdAt: FirestoreTimestamp;
}
