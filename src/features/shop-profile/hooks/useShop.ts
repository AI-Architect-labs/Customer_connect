'use client';
import { useEffect, useState } from 'react';
import { subscribeToShop } from '@/lib/repositories/shopRepository';
import type { Shop } from '@/types/shop';
export function useShop(shopId:string){
 const [shop,setShop]=useState<Shop|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{setLoading(true); return subscribeToShop(shopId,(value)=>{setShop(value);setLoading(false);setError(null);});},[shopId]);
 return {shop,loading,error};
}
