'use client';
import { useEffect, useState } from 'react';
import { getProduct } from '@/lib/repositories/productRepository';
import type { Product } from '@/types/product';
export function useProduct(shopId: string, productId: string) {
  const requestKey = `${shopId}:${productId}`;
  const [result, setResult] = useState<{ key: string; product: Product | null }>({
    key: '',
    product: null,
  });
  useEffect(() => {
    let current = true;
    getProduct(shopId, productId)
      .then((p) => {
        if (current) setResult({ key: requestKey, product: p });
      })
      .catch(() => {
        if (current) setResult({ key: requestKey, product: null });
      });
    return () => {
      current = false;
    };
  }, [shopId, productId, requestKey]);
  return {
    product: result.key === requestKey ? result.product : null,
    loading: result.key !== requestKey,
  };
}
