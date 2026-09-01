'use client';
import { useEffect,useMemo,useState } from 'react';
import { subscribeProducts } from '@/lib/repositories/productRepository';
import type { Product } from '@/types/product';
export function useProducts(shopId:string, options?:{activeOnly?:boolean;categoryId?:string;search?:string}){
 const [products,setProducts]=useState<Product[]>([]); const [loading,setLoading]=useState(true);
 const activeOnly=options?.activeOnly??false; const categoryId=options?.categoryId;
 useEffect(()=>{setLoading(true);return subscribeProducts(shopId,(items)=>{setProducts(items);setLoading(false);},{activeOnly,categoryId});},[shopId,activeOnly,categoryId]);
 const filtered=useMemo(()=>{const term=options?.search?.trim().toLowerCase();if(!term)return products;return products.filter(p=>`${p.name} ${p.brand??''}`.toLowerCase().includes(term));},[products,options?.search]);
 return {products:filtered,loading};
}
