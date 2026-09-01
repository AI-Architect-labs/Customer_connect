'use client';

import { useEffect, useState } from 'react';
import { subscribeOrder } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';

export function useOrder(shopId: string, orderId: string, enabled = true) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !shopId || !orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeOrder(shopId, orderId, (value) => {
      setOrder(value);
      setLoading(false);
    });
  }, [shopId, orderId, enabled]);

  return { order, loading };
}
