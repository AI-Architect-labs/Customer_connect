'use client';
import { useEffect,useState } from 'react';
import { subscribeActiveCategories, subscribeAllCategories } from '@/lib/repositories/categoryRepository';
import type { Category } from '@/types/category';
export function useCategories(shopId:string, includeInactive=false){
 const [categories,setCategories]=useState<Category[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{setLoading(true);const subscribe=includeInactive?subscribeAllCategories:subscribeActiveCategories;return subscribe(shopId,(items)=>{setCategories(items);setLoading(false);});},[shopId,includeInactive]);
 return {categories,loading};
}
