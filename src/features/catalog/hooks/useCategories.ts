'use client';
import { useEffect, useState } from 'react';
import {
  subscribeActiveCategories,
  subscribeAllCategories,
} from '@/lib/repositories/categoryRepository';
import type { Category } from '@/types/category';
export function useCategories(shopId: string, includeInactive = false) {
  const requestKey = `${shopId}:${includeInactive}`;
  const [result, setResult] = useState<{ key: string; categories: Category[] }>({
    key: '',
    categories: [],
  });
  useEffect(() => {
    const subscribe = includeInactive ? subscribeAllCategories : subscribeActiveCategories;
    return subscribe(shopId, (items) => {
      setResult({ key: requestKey, categories: items });
    });
  }, [shopId, includeInactive, requestKey]);
  return {
    categories: result.key === requestKey ? result.categories : [],
    loading: result.key !== requestKey,
  };
}
