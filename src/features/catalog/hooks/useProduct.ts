'use client';
import { useEffect,useState } from 'react';
import { getProduct } from '@/lib/repositories/productRepository';
import type { Product } from '@/types/product';
export function useProduct(shopId:string,productId:string){
 const [product,setProduct]=useState<Product|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{let current=true;setLoading(true);getProduct(shopId,productId).then(p=>{if(current){setProduct(p);setLoading(false);}}).catch(()=>{if(current)setLoading(false);});return()=>{current=false;};},[shopId,productId]);
 return {product,loading};
}
