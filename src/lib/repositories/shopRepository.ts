import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Shop } from '@/types/shop';
import { omitUndefined } from '@/lib/utils/firestore';

export async function getShop(shopId: string): Promise<Shop | null> {
  const snap = await getDoc(doc(db, 'shops', shopId));
  return snap.exists() ? (snap.data() as Shop) : null;
}

export function subscribeToShop(shopId: string, cb: (shop: Shop | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'shops', shopId), (snap) => cb(snap.exists() ? (snap.data() as Shop) : null));
}

export async function createShop(shopId: string, data: Omit<Shop, 'createdAt' | 'updatedAt'>): Promise<void> {
  await setDoc(doc(db, 'shops', shopId), omitUndefined({ ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}

export async function updateShop(shopId: string, patch: Partial<Shop>): Promise<void> {
  await updateDoc(doc(db, 'shops', shopId), omitUndefined({ ...patch, updatedAt: serverTimestamp() }));
}
