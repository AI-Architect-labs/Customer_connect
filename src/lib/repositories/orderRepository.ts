import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Order } from '@/types/order';
import type { OrderStatus } from '@/constants/enums';
function col(shopId:string){return collection(db,'shops',shopId,'orders');}
function mapDoc(d:{id:string;data():unknown}):Order{return {id:d.id,...(d.data() as Omit<Order,'id'>)};}
export function subscribeOwnerOrders(shopId:string, cb:(items:Order[])=>void, status?:OrderStatus):Unsubscribe{
 const q=status?query(col(shopId),where('status','==',status),orderBy('createdAt','desc')):query(col(shopId),orderBy('createdAt','desc'));
 return onSnapshot(q,(snap)=>cb(snap.docs.map(mapDoc)));
}
export function subscribeOrdersByPhone(shopId:string, phone:string, cb:(items:Order[])=>void):Unsubscribe{
 return onSnapshot(query(col(shopId),where('customerPhone','==',phone),orderBy('createdAt','desc')),(snap)=>cb(snap.docs.map(mapDoc)));
}
export function subscribeOrder(shopId:string, orderId:string, cb:(order:Order|null)=>void):Unsubscribe{
 return onSnapshot(doc(db,'shops',shopId,'orders',orderId),(snap)=>cb(snap.exists()?{id:snap.id,...(snap.data() as Omit<Order,'id'>)}:null));
}
export async function updateOrderFields(shopId:string, orderId:string, patch:Partial<Order>):Promise<void>{
 const {id:_id,...rest}=patch as Partial<Order>&{id?:string}; await updateDoc(doc(db,'shops',shopId,'orders',orderId),{...rest,updatedAt:serverTimestamp()});
}
