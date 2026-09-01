'use client';
import { useEffect,useState } from 'react';
import { subscribeOrdersByPhone } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';
export function useOrderHistory(shopId:string,phone?:string){const[orders,setOrders]=useState<Order[]>([]);const[loading,setLoading]=useState(Boolean(phone));useEffect(()=>{if(!phone){setOrders([]);setLoading(false);return;}setLoading(true);return subscribeOrdersByPhone(shopId,phone,(items)=>{setOrders(items);setLoading(false);});},[shopId,phone]);return{orders,loading};}
