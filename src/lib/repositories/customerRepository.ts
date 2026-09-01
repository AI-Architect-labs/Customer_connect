import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Customer } from '@/types/customer';
export async function getCustomer(shopId:string, normalizedPhone:string):Promise<Customer|null>{
 const snap=await getDoc(doc(db,'shops',shopId,'customers',normalizedPhone)); return snap.exists()?(snap.data() as Customer):null;
}
