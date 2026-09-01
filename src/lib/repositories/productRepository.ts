import {
  addDoc,
  setDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Product } from '@/types/product';
import { omitUndefined } from '@/lib/utils/firestore';

function col(shopId: string) { return collection(db, 'shops', shopId, 'products'); }
function mapDoc(d: { id: string; data(): unknown }): Product { return { id: d.id, ...(d.data() as Omit<Product,'id'>) }; }

export function subscribeProducts(shopId: string, cb: (items: Product[]) => void, options?: { activeOnly?: boolean; categoryId?: string }): Unsubscribe {
  const constraints: QueryConstraint[] = [];
  if (options?.categoryId) constraints.push(where('categoryId','==',options.categoryId));
  if (options?.activeOnly) constraints.push(where('active','==',true));
  constraints.push(orderBy('name','asc'));
  return onSnapshot(query(col(shopId), ...constraints), (snap) => cb(snap.docs.map(mapDoc)));
}
export async function getProduct(shopId: string, productId: string): Promise<Product | null> {
  const snap = await getDoc(doc(db,'shops',shopId,'products',productId)); return snap.exists()?{id:snap.id,...(snap.data() as Omit<Product,'id'>)}:null;
}
export async function createProduct(shopId: string, data: Omit<Product,'id'|'createdAt'|'updatedAt'>): Promise<string> {
  const ref=await addDoc(col(shopId),omitUndefined({...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})); return ref.id;
}
export async function updateProduct(shopId:string, productId:string, patch:Partial<Product>):Promise<void>{
  const {id:_id,...rest}=patch as Partial<Product>&{id?:string};
  await updateDoc(doc(db,'shops',shopId,'products',productId),omitUndefined({...rest,updatedAt:serverTimestamp()}));
}

export function newProductId(shopId: string): string { return doc(col(shopId)).id; }
export async function createProductWithId(shopId:string, productId:string, data:Omit<Product,'id'|'createdAt'|'updatedAt'>):Promise<void>{
  await setDoc(doc(db,'shops',shopId,'products',productId),omitUndefined({...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
}
