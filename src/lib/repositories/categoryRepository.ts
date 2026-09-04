import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Category } from '@/types/category';
import { omitUndefined } from '@/lib/utils/firestore';

function col(shopId: string) {
  return collection(db, 'shops', shopId, 'categories');
}
function mapDoc(d: { id: string; data(): unknown }): Category {
  return { id: d.id, ...(d.data() as Omit<Category, 'id'>) };
}

export function subscribeActiveCategories(
  shopId: string,
  cb: (items: Category[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(col(shopId), where('active', '==', true), orderBy('sortOrder', 'asc')),
    (snap) => cb(snap.docs.map(mapDoc)),
  );
}
export function subscribeAllCategories(
  shopId: string,
  cb: (items: Category[]) => void,
): Unsubscribe {
  return onSnapshot(query(col(shopId), orderBy('sortOrder', 'asc')), (snap) =>
    cb(snap.docs.map(mapDoc)),
  );
}
export async function listAllCategories(shopId: string): Promise<Category[]> {
  const snap = await getDocs(query(col(shopId), orderBy('sortOrder', 'asc')));
  return snap.docs.map(mapDoc);
}
export async function createCategory(
  shopId: string,
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(
    col(shopId),
    omitUndefined({ ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  );
  return ref.id;
}
export async function updateCategory(
  shopId: string,
  categoryId: string,
  patch: Partial<Category>,
): Promise<void> {
  const { id: _id, ...rest } = patch as Partial<Category> & { id?: string };
  await updateDoc(
    doc(db, 'shops', shopId, 'categories', categoryId),
    omitUndefined({ ...rest, updatedAt: serverTimestamp() }),
  );
}
