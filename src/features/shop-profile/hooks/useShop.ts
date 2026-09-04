'use client';
import { useEffect, useState } from 'react';
import { subscribeToShop } from '@/lib/repositories/shopRepository';
import type { Shop } from '@/types/shop';
export function useShop(shopId: string) {
  const [result, setResult] = useState<{ shopId: string; shop: Shop | null }>({
    shopId: '',
    shop: null,
  });
  useEffect(() => {
    return subscribeToShop(shopId, (value) => {
      setResult({ shopId, shop: value });
    });
  }, [shopId]);
  return {
    shop: result.shopId === shopId ? result.shop : null,
    loading: result.shopId !== shopId,
    error: null,
  };
}
