'use client';

import { useEffect, useState } from 'react';
import { subscribeOrder } from '@/lib/repositories/orderRepository';
import type { Order } from '@/types/order';

export function useOrder(shopId: string, orderId: string, enabled = true) {
  const requestKey = enabled && shopId && orderId ? `${shopId}:${orderId}` : '';
  const [result, setResult] = useState<{ key: string; order: Order | null }>({
    key: '',
    order: null,
  });

  useEffect(() => {
    if (!requestKey) return;
    return subscribeOrder(shopId, orderId, (value) => {
      setResult({ key: requestKey, order: value });
    });
  }, [shopId, orderId, requestKey]);

  return {
    order: requestKey && result.key === requestKey ? result.order : null,
    loading: Boolean(requestKey) && result.key !== requestKey,
  };
}
