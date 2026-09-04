'use client';
import { useEffect, useMemo, useState } from 'react';
import { subscribeProducts } from '@/lib/repositories/productRepository';
import type { Product } from '@/types/product';
export function useProducts(
  shopId: string,
  options?: { activeOnly?: boolean; categoryId?: string; search?: string },
) {
  const activeOnly = options?.activeOnly ?? false;
  const categoryId = options?.categoryId;
  const requestKey = `${shopId}:${activeOnly}:${categoryId ?? ''}`;
  const [result, setResult] = useState<{ key: string; products: Product[] }>({
    key: '',
    products: [],
  });
  useEffect(() => {
    return subscribeProducts(
      shopId,
      (items) => {
        setResult({ key: requestKey, products: items });
      },
      { activeOnly, categoryId },
    );
  }, [shopId, activeOnly, categoryId, requestKey]);
  const filtered = useMemo(() => {
    const products = result.key === requestKey ? result.products : [];
    const term = options?.search?.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(term));
  }, [result, requestKey, options?.search]);
  return { products: filtered, loading: result.key !== requestKey };
}
