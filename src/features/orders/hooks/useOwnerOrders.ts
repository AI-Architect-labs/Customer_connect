'use client';
import { useEffect,useState } from 'react';
import { subscribeOwnerOrders } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';
import type { OrderStatus } from '@/constants/enums';
export function useOwnerOrders(shopId:string,status?:OrderStatus){const[orders,setOrders]=useState<Order[]>([]);const[loading,setLoading]=useState(true);useEffect(()=>{setLoading(true);return subscribeOwnerOrders(shopId,(items)=>{setOrders(items);setLoading(false);},status);},[shopId,status]);return{orders,loading};}
