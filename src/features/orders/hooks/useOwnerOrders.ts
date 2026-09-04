'use client';
import { useEffect, useState } from 'react';
import { subscribeOwnerOrders } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';
import type { OrderStatus } from '@/constants/enums';
export function useOwnerOrders(shopId: string, status?: OrderStatus) {
  const requestKey = `${shopId}:${status ?? ''}`;
  const [result, setResult] = useState<{ key: string; orders: Order[] }>({
    key: '',
    orders: [],
  });
  useEffect(() => {
    return subscribeOwnerOrders(
      shopId,
      (items) => {
        setResult({ key: requestKey, orders: items });
      },
      status,
    );
  }, [shopId, status, requestKey]);
  return {
    orders: result.key === requestKey ? result.orders : [],
    loading: result.key !== requestKey,
  };
}
