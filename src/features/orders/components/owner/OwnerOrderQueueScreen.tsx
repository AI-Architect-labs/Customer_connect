'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useOwnerOrders } from '../../hooks/useOwnerOrders';
import { Select } from '@/components/ui/Select';
import StatusPill from '../StatusPill';
import type { OrderStatus } from '@/constants/enums';
export function OwnerOrderQueueScreen() {
  const { session } = useAuth();
  const shopId = session?.ownerProfile?.shopId ?? '';
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { orders, loading } = useOwnerOrders(shopId, status || undefined);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <Select
          className="w-56"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
        >
          <option value="">All statuses</option>
          <option value="placed">Placed</option>
          <option value="confirmed">Confirmed</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      {loading ? (
        <p>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border bg-background p-6 text-muted-foreground">
          No matching orders.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-semibold">#{o.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div>{o.customerName}</div>
                    <div className="text-sm text-muted-foreground">{o.customerPhone}</div>
                  </td>
                  <td className="p-3">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className="p-3">₹{o.subtotal.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="p-3">
                    <Link className="font-semibold text-primary" href={`/owner/orders/${o.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
