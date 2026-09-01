import {
  doc,
  getDoc,
  setDoc,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Owner } from '@/types/owner';

const OWNERS_COLLECTION = 'owners';

/**
 * Maps between the `Owner` TypeScript shape and raw Firestore document
 * data. Kept in this file (not shared) since only this repository ever
 * reads/writes the `owners` collection directly, per Architecture.md §2.5.
 */
const ownerConverter: FirestoreDataConverter<Owner> = {
  toFirestore(owner: Owner): DocumentData {
    return {
      shopId: owner.shopId,
      email: owner.email,
      displayName: owner.displayName,
      role: owner.role,
      createdAt: owner.createdAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Owner {
    const data = snapshot.data(options);
    return {
      shopId: data.shopId,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt,
    };
  },
};

function ownerDocRef(ownerUid: string) {
  return doc(db, OWNERS_COLLECTION, ownerUid).withConverter(ownerConverter);
}

/**
 * Reads an owner's profile document by their Firebase Auth UID. Returns
 * `null` if no such document exists — this is how session-tier resolution
 * (features/auth/utils/session.ts) distinguishes an owner session from any
 * other authenticated session (a non-owner Firebase user simply has no
 * matching `owners/{uid}` document).
 */
export async function getOwnerByUid(ownerUid: string): Promise<Owner | null> {
  const snapshot = await getDoc(ownerDocRef(ownerUid));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Creates or overwrites an owner's profile document. Used by the owner
 * account-creation flow (Milestone 1.2) — included here now since it's a
 * thin, generic repository operation with no business logic of its own.
 */
export async function setOwner(ownerUid: string, owner: Owner): Promise<void> {
  await setDoc(ownerDocRef(ownerUid), owner);
}
