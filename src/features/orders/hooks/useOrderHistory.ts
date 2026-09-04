'use client';
import { useEffect, useState } from 'react';
import { subscribeOrdersByPhone } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';
export function useOrderHistory(shopId: string, phone?: string) {
  const requestKey = phone ? `${shopId}:${phone}` : '';
  const [result, setResult] = useState<{ key: string; orders: Order[] }>({
    key: '',
    orders: [],
  });
  useEffect(() => {
    if (!phone || !requestKey) return;
    return subscribeOrdersByPhone(shopId, phone, (items) => {
      setResult({ key: requestKey, orders: items });
    });
  }, [shopId, phone, requestKey]);
  return {
    orders: requestKey && result.key === requestKey ? result.orders : [],
    loading: Boolean(requestKey) && result.key !== requestKey,
  };
}
